import unittest
import sys
import os
import time
import random
import csv

# Add app directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "app")))

from config import NODES
from consistency import ConsistencyLevel, get_required_acks, is_write_satisfied, resolve_read_records
from fault_injection import fault_injector, SimulatedFaultError
from adaptive import AdaptiveController, CONTROLLER_VERSION
from metrics import MetricsCollector
from database import (
    version_manager,
    health_cache,
    enable_mock_storage,
    disable_mock_storage,
    clear_mock_storage,
    put,
    get,
    delete,
    apply_record,
    get_all,
    is_node_alive
)
from replication import ReplicationManager


class TestFaultInjectionAndUnitValidation(unittest.TestCase):
    """
    Comprehensive Phase 2 Unit Tests.
    Validates all 20 requirements without requiring live PostgreSQL/Docker.
    """

    @classmethod
    def setUpClass(cls):
        enable_mock_storage()

    @classmethod
    def tearDownClass(cls):
        disable_mock_storage()
        fault_injector.reset()

    def setUp(self):
        clear_mock_storage()
        fault_injector.reset()
        health_cache.set_mock_status({n: True for n in NODES})
        self.replication = ReplicationManager(max_workers=8)
        self.metrics = MetricsCollector()
        self.controller = AdaptiveController(cooldown_ops=5, window_size=10)

    def tearDown(self):
        fault_injector.reset()

    # 1. Baseline operation with four healthy replicas
    def test_01_baseline_operation_four_healthy_replicas(self):
        res = self.replication.replicate_write("PUT", "key1", "val1", ConsistencyLevel.STRONG)
        self.assertTrue(res["success"])
        self.assertEqual(res["ack_count"], 4)
        self.assertEqual(len(res["successful_nodes"]), 4)

        read_res = self.replication.replicate_read("key1", ConsistencyLevel.STRONG)
        self.assertTrue(read_res["found"])
        self.assertEqual(read_res["value"], "val1")
        self.assertFalse(read_res["is_stale"])

    # 2. STRONG writes with all four replicas
    def test_02_strong_writes_all_four_replicas(self):
        res = self.replication.replicate_write("PUT", "strong_key", "val_strong", ConsistencyLevel.STRONG)
        self.assertTrue(res["success"])
        self.assertEqual(res["ack_count"], 4)
        self.assertEqual(res["required_acks"], 4)

    # 3. STRONG writes with one replica unavailable
    def test_03_strong_writes_one_replica_unavailable(self):
        with fault_injector.override(unavailable_nodes={"node4"}):
            res = self.replication.replicate_write("PUT", "strong_key_fail", "val", ConsistencyLevel.STRONG)
            self.assertFalse(res["success"])
            self.assertEqual(res["ack_count"], 3)
            self.assertIn("node4", res["failed_nodes"])

    # 4. QUORUM writes with three replicas
    def test_04_quorum_writes_three_replicas(self):
        with fault_injector.override(unavailable_nodes={"node4"}):
            res = self.replication.replicate_write("PUT", "quorum_key", "val_q", ConsistencyLevel.QUORUM)
            self.assertTrue(res["success"])
            self.assertGreaterEqual(res["ack_count"], 3)

    # 5. QUORUM writes with only two replicas
    def test_05_quorum_writes_two_replicas(self):
        with fault_injector.override(unavailable_nodes={"node3", "node4"}):
            res = self.replication.replicate_write("PUT", "quorum_fail", "val", ConsistencyLevel.QUORUM)
            self.assertFalse(res["success"])
            self.assertEqual(res["ack_count"], 2)

    # 6. EVENTUAL writes with one available replica
    def test_06_eventual_writes_one_available_replica(self):
        with fault_injector.override(unavailable_nodes={"node2", "node3", "node4"}):
            res = self.replication.replicate_write("PUT", "ev_key", "val_ev", ConsistencyLevel.EVENTUAL)
            self.assertTrue(res["success"])
            self.assertEqual(res["ack_count"], 1)

    # 7. Adaptive selection with all replicas healthy and low latency
    def test_07_adaptive_selection_healthy_low_latency(self):
        mode, reason = self.controller.choose_consistency(
            alive_nodes=4,
            total_nodes=4,
            average_latency=25.0,
            request_rate=20.0,
            read_write_ratio=1.0
        )
        self.assertEqual(mode, ConsistencyLevel.STRONG)
        self.assertIn("healthy", reason.lower())

    # 8. Adaptive selection with elevated latency
    def test_08_adaptive_selection_elevated_latency(self):
        mode, reason = self.controller.choose_consistency(
            alive_nodes=4,
            total_nodes=4,
            average_latency=95.0,
            request_rate=30.0,
            read_write_ratio=1.0
        )
        self.assertEqual(mode, ConsistencyLevel.QUORUM)

        mode_high, _ = self.controller.choose_consistency(
            alive_nodes=4,
            total_nodes=4,
            average_latency=210.0,
            request_rate=30.0,
            read_write_ratio=1.0
        )
        self.assertEqual(mode_high, ConsistencyLevel.EVENTUAL)

    # 9. Adaptive selection with only three replicas
    def test_09_adaptive_selection_three_replicas_never_strong(self):
        mode_low, _ = self.controller.choose_consistency(
            alive_nodes=3,
            total_nodes=4,
            average_latency=15.0,
            request_rate=10.0,
            read_write_ratio=1.0
        )
        self.assertEqual(mode_low, ConsistencyLevel.QUORUM)
        self.assertNotEqual(mode_low, ConsistencyLevel.STRONG)

        mode_high, _ = self.controller.choose_consistency(
            alive_nodes=3,
            total_nodes=4,
            average_latency=160.0,
            request_rate=10.0,
            read_write_ratio=1.0
        )
        self.assertEqual(mode_high, ConsistencyLevel.EVENTUAL)

    # 10. Adaptive selection with two replicas
    def test_10_adaptive_selection_two_replicas_falls_back_to_eventual(self):
        mode, reason = self.controller.choose_consistency(
            alive_nodes=2,
            total_nodes=4,
            average_latency=20.0,
            request_rate=10.0,
            read_write_ratio=1.0
        )
        self.assertEqual(mode, ConsistencyLevel.EVENTUAL)
        self.assertIn("node failure", reason.lower())

    # 11. Configurable per-node delays
    def test_11_configurable_per_node_delays(self):
        with fault_injector.override(enabled=True, delay_ms=10.0, node_delays={"node2": 50.0}):
            self.assertEqual(fault_injector.get_effective_delay_ms("node1"), 10.0)
            self.assertEqual(fault_injector.get_effective_delay_ms("node2"), 50.0)

    # 12. Simulated operation failures
    def test_12_simulated_operation_failures(self):
        with fault_injector.override(enabled=True, failure_probability=1.0):
            with self.assertRaises(SimulatedFaultError):
                fault_injector.apply_faults("node1")

    # 13. Replication lag and stale-read detection
    def test_13_replication_lag_and_stale_read_detection(self):
        key = "stale_test_key"
        # 1. Base write to node1 and node2
        v1 = version_manager.next_version()
        put("node1", key, "v1_value", version=v1)
        put("node2", key, "v1_value", version=v1)
        self.metrics.record_committed_version(key, v1)

        # 2. Update only on node1 (simulating replication lag to node2)
        v2 = version_manager.next_version()
        put("node1", key, "v2_updated", version=v2)
        self.metrics.record_committed_version(key, v2)

        # 3. Read directly from node2 (stale version v1)
        rec = get("node2", key)
        self.assertEqual(rec[2], v1)

        # 4. Metrics stale read detection
        self.metrics.record_operation("GET", 5.0, True, "EVENTUAL", key=key, returned_version=rec[2], found=True)
        self.assertEqual(self.metrics.stale_reads, 1)

    # 14. Replica recovery and reconciliation
    def test_14_replica_recovery_and_reconciliation(self):
        key_a = "rec_key_a"
        key_b = "rec_key_b"

        # node1 and node2 are healthy, node3 is missing key_b and has older key_a
        v_old = version_manager.next_version()
        v_new_a = version_manager.next_version()
        v_new_b = version_manager.next_version()

        put("node1", key_a, "new_a_val", version=v_new_a)
        put("node1", key_b, "new_b_val", version=v_new_b)

        put("node3", key_a, "old_a_val", version=v_old)
        # node3 does not have key_b

        reconciled = self.replication.reconcile_node("node3")
        self.assertEqual(reconciled, 2)

        rec_a = get("node3", key_a)
        rec_b = get("node3", key_b)
        self.assertEqual(rec_a[1], "new_a_val")
        self.assertEqual(rec_a[2], v_new_a)
        self.assertEqual(rec_b[1], "new_b_val")
        self.assertEqual(rec_b[2], v_new_b)

    # 15. Tombstone preservation during recovery
    def test_15_tombstone_preservation_during_recovery(self):
        del_key = "tomb_del_key"
        v1 = version_manager.next_version()
        v2_del = version_manager.next_version()

        # Healthy node has tombstone
        delete("node1", del_key, version=v2_del)
        # Recovered node has old active value
        put("node4", del_key, "stale_alive", version=v1)

        reconciled = self.replication.reconcile_node("node4")
        self.assertGreaterEqual(reconciled, 1)

        rec = get("node4", del_key)
        self.assertTrue(rec[3]) # deleted == True
        self.assertEqual(rec[2], v2_del)

    # 16. Fault cleanup after an exception
    def test_16_fault_cleanup_after_exception(self):
        try:
            with fault_injector.override(enabled=True, delay_ms=100.0, unavailable_nodes={"node1"}):
                self.assertTrue(fault_injector.enabled)
                self.assertTrue(fault_injector.is_node_simulated_unavailable("node1"))
                raise RuntimeError("Controlled failure inside context")
        except RuntimeError:
            pass

        # Verify state was restored
        self.assertFalse(fault_injector.enabled)
        self.assertEqual(fault_injector.delay_ms, 0.0)
        self.assertFalse(fault_injector.is_node_simulated_unavailable("node1"))

    # 17. Repeatability with a fixed random seed
    def test_17_repeatability_with_fixed_seed(self):
        with fault_injector.override(enabled=True, failure_probability=0.5, seed=12345):
            results_1 = [fault_injector.should_fail_request() for _ in range(20)]

        with fault_injector.override(enabled=True, failure_probability=0.5, seed=12345):
            results_2 = [fault_injector.should_fail_request() for _ in range(20)]

        self.assertEqual(results_1, results_2)

    # 18. Health-cache behavior
    def test_18_health_cache_behavior(self):
        health_cache.set_mock_status({"node1": True, "node2": True, "node3": False, "node4": True})
        self.assertTrue(health_cache.is_alive("node1"))
        self.assertFalse(health_cache.is_alive("node3"))

        # Simulated unavailability overrides cache
        with fault_injector.override(unavailable_nodes={"node1"}):
            self.assertFalse(health_cache.is_alive("node1"))

    # 19. Correct operation counts and latency percentiles
    def test_19_correct_operation_counts_and_latency_percentiles(self):
        m = MetricsCollector()
        for lat in [10.0, 20.0, 30.0, 40.0, 50.0, 60.0, 70.0, 80.0, 90.0, 100.0]:
            m.record_operation("PUT", lat, True, "QUORUM")

        summary = m.get_summary()
        self.assertEqual(summary["total_operations"], 10)
        self.assertEqual(summary["successful_operations"], 10)
        self.assertEqual(summary["avg_latency_ms"], 55.0)
        self.assertEqual(summary["median_latency_ms"], 60.0)
        self.assertAlmostEqual(summary["p95_latency_ms"], 100.0)

    # 20. Adaptive decision-log contents
    def test_20_adaptive_decision_log_contents(self):
        ctrl = AdaptiveController(cooldown_ops=0, window_size=5)
        mode, reason = ctrl.evaluate_and_select(
            op_type="PUT",
            recent_avg_latency=40.0,
            recent_request_rate=20.0,
            recent_rw_ratio=1.0,
            forced_alive_nodes=4
        )
        self.assertGreater(len(ctrl.decisions_log), 0)
        entry = ctrl.decisions_log[-1]
        self.assertEqual(entry["controller_version"], CONTROLLER_VERSION)
        self.assertEqual(entry["alive_nodes"], "4/4")
        self.assertIn("reason", entry)
        self.assertIn("timestamp", entry)


if __name__ == "__main__":
    unittest.main()
