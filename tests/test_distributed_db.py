import unittest
import sys
import os
import time

# Add app directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "app")))

from consistency import (
    ConsistencyLevel,
    get_required_acks,
    is_write_satisfied,
    resolve_read_records
)
from adaptive import AdaptiveController
from metrics import MetricsCollector
from database import version_manager, put, get, delete, is_node_alive, init_db_schema, health_cache
from config import NODES


class TestAdaptiveControllerRules(unittest.TestCase):
    def setUp(self):
        health_cache.set_mock_status({n: True for n in NODES})
        self.controller = AdaptiveController(cooldown_ops=5, window_size=10)

    def tearDown(self):
        health_cache.set_mock_status(None)


    def test_1_all_nodes_healthy_low_latency_selects_strong(self):
        """1. 4/4 nodes + low latency (< 75ms) + low load -> STRONG."""
        mode, reason = self.controller.choose_consistency(
            alive_nodes=4,
            total_nodes=4,
            average_latency=30.0,
            request_rate=20.0,
            read_write_ratio=1.0
        )
        self.assertEqual(mode, ConsistencyLevel.STRONG)
        self.assertIn("all nodes healthy", reason.lower())

    def test_2_all_nodes_healthy_moderate_workload_selects_quorum(self):
        """2. 4/4 nodes + moderate workload / latency -> QUORUM."""
        mode, reason = self.controller.choose_consistency(
            alive_nodes=4,
            total_nodes=4,
            average_latency=85.0,
            request_rate=60.0,
            read_write_ratio=1.0
        )
        self.assertEqual(mode, ConsistencyLevel.QUORUM)

    def test_3_high_latency_selects_eventual(self):
        """3. High latency (> 150ms) -> EVENTUAL."""
        mode, reason = self.controller.choose_consistency(
            alive_nodes=4,
            total_nodes=4,
            average_latency=180.0,
            request_rate=40.0,
            read_write_ratio=1.0
        )
        self.assertEqual(mode, ConsistencyLevel.EVENTUAL)

    def test_4_high_workload_or_severe_latency_selects_eventual(self):
        """4. High workload (>= 100 ops/s) or severe latency (> 300ms) -> EVENTUAL."""
        mode1, _ = self.controller.choose_consistency(
            alive_nodes=4,
            total_nodes=4,
            average_latency=350.0,
            request_rate=30.0,
            read_write_ratio=1.0
        )
        self.assertEqual(mode1, ConsistencyLevel.EVENTUAL)

        mode2, _ = self.controller.choose_consistency(
            alive_nodes=4,
            total_nodes=4,
            average_latency=50.0,
            request_rate=120.0,
            read_write_ratio=1.0
        )
        self.assertEqual(mode2, ConsistencyLevel.EVENTUAL)

    def test_5_three_nodes_alive_never_selects_strong(self):
        """5. 3/4 nodes alive -> Never STRONG (QUORUM or EVENTUAL)."""
        mode_low_lat, _ = self.controller.choose_consistency(
            alive_nodes=3,
            total_nodes=4,
            average_latency=20.0,
            request_rate=10.0,
            read_write_ratio=1.0
        )
        self.assertNotEqual(mode_low_lat, ConsistencyLevel.STRONG)
        self.assertEqual(mode_low_lat, ConsistencyLevel.QUORUM)

        mode_high_lat, _ = self.controller.choose_consistency(
            alive_nodes=3,
            total_nodes=4,
            average_latency=200.0,
            request_rate=10.0,
            read_write_ratio=1.0
        )
        self.assertEqual(mode_high_lat, ConsistencyLevel.EVENTUAL)

    def test_6_two_nodes_alive_falls_back_to_eventual(self):
        """6. <= 2 nodes alive -> EVENTUAL (Quorum impossible)."""
        mode, reason = self.controller.choose_consistency(
            alive_nodes=2,
            total_nodes=4,
            average_latency=20.0,
            request_rate=10.0,
            read_write_ratio=1.0
        )
        self.assertEqual(mode, ConsistencyLevel.EVENTUAL)

    def test_7_read_heavy_workload_adaptation(self):
        """7. Read-heavy workload (read_ratio >= 0.70)."""
        # rw_ratio = 4.0 -> read_ratio = 4/5 = 0.80
        mode_low_lat, _ = self.controller.choose_consistency(
            alive_nodes=4,
            total_nodes=4,
            average_latency=40.0,
            request_rate=30.0,
            read_write_ratio=4.0
        )
        self.assertEqual(mode_low_lat, ConsistencyLevel.QUORUM)

        mode_high_lat, _ = self.controller.choose_consistency(
            alive_nodes=4,
            total_nodes=4,
            average_latency=90.0,
            request_rate=30.0,
            read_write_ratio=4.0
        )
        self.assertEqual(mode_high_lat, ConsistencyLevel.EVENTUAL)

    def test_8_write_heavy_workload_adaptation(self):
        """8. Write-heavy workload (write_ratio >= 0.70)."""
        # rw_ratio = 0.1 -> write_ratio = 1 / 1.1 = 0.91
        mode_low_lat, _ = self.controller.choose_consistency(
            alive_nodes=4,
            total_nodes=4,
            average_latency=40.0,
            request_rate=30.0,
            read_write_ratio=0.1
        )
        self.assertEqual(mode_low_lat, ConsistencyLevel.QUORUM)

        mode_high_lat, _ = self.controller.choose_consistency(
            alive_nodes=4,
            total_nodes=4,
            average_latency=90.0,
            request_rate=30.0,
            read_write_ratio=0.1
        )
        self.assertEqual(mode_high_lat, ConsistencyLevel.EVENTUAL)

    def test_9_adaptive_cooldown_mechanism(self):
        """9. Adaptive cooldown prevents premature switching."""
        ctrl = AdaptiveController(cooldown_ops=10, window_size=10)
        ctrl._current_mode = ConsistencyLevel.STRONG
        ctrl._ops_since_switch = 0

        # Simulate proposed switch to EVENTUAL under high latency
        mode1, _ = ctrl.evaluate_and_select(recent_avg_latency=250.0)
        # Should stay in STRONG because cooldown (10 ops) has not elapsed
        self.assertEqual(mode1, ConsistencyLevel.STRONG)

    def test_10_adaptive_hysteresis_prevents_flapping(self):
        """10. Adaptive hysteresis requires persistent observations before switching."""
        ctrl = AdaptiveController(cooldown_ops=0, window_size=10)
        ctrl._current_mode = ConsistencyLevel.STRONG
        ctrl._ops_since_switch = 100

        # First spike
        mode1, _ = ctrl.evaluate_and_select(recent_avg_latency=250.0)
        # Must not switch on 1 single observation
        self.assertEqual(mode1, ConsistencyLevel.STRONG)


class TestCoreDistributedGuarantees(unittest.TestCase):
    def test_11_version_numbers_remain_monotonic(self):
        """11. VersionManager generates strictly increasing logical versions."""
        v1 = version_manager.next_version()
        v2 = version_manager.next_version()
        v3 = version_manager.next_version()
        self.assertGreater(v2, v1)
        self.assertGreater(v3, v2)

    def test_12_stale_reads_measured_correctly(self):
        """12. Stale reads detected when returned version is strictly older than latest known committed."""
        collector = MetricsCollector()
        collector.record_committed_version("key_A", 105)

        # Non-stale read (version 105 returned)
        collector.record_operation("GET", 15.0, True, "QUORUM", key="key_A", returned_version=105, found=True)
        self.assertEqual(collector.stale_reads, 0)

        # Stale read (version 102 returned)
        collector.record_operation("GET", 15.0, True, "EVENTUAL", key="key_A", returned_version=102, found=True)
        self.assertEqual(collector.stale_reads, 1)
        self.assertEqual(collector.consistency_violations, 1)

    def test_13_tombstone_and_stale_update_rejection(self):
        """13. Database CRUD layer tests version ordering and tombstone handling."""
        if not is_node_alive("node1"):
            self.skipTest("node1 not reachable")

        key = f"test_mono_key_{int(time.time()*1000)}"
        v_base = version_manager.next_version()
        v_next = version_manager.next_version()

        # 1. Initial write
        self.assertTrue(put("node1", key, "v1_data", version=v_base))
        rec = get("node1", key)
        self.assertEqual(rec[1], "v1_data")
        self.assertEqual(rec[2], v_base)

        # 2. Update to higher version
        self.assertTrue(put("node1", key, "v2_data", version=v_next))
        rec = get("node1", key)
        self.assertEqual(rec[1], "v2_data")
        self.assertEqual(rec[2], v_next)

        # 3. Reject stale write (lower version v_base cannot overwrite v_next)
        put("node1", key, "stale_data", version=v_base)
        rec = get("node1", key)
        self.assertEqual(rec[1], "v2_data")

        # 4. Tombstone delete
        v_tomb = version_manager.next_version()
        self.assertTrue(delete("node1", key, version=v_tomb))
        rec = get("node1", key)
        self.assertTrue(rec[3]) # deleted == True
        self.assertEqual(rec[2], v_tomb)


if __name__ == "__main__":
    unittest.main()
