"""
Quarantine gate for legacy tests.

These files target the deleted `gtplanner/` PocketFlow agent stack (the
pre-simplification architecture). They are kept for reference only and are
excluded from collection; pytest will not import them.
"""
collect_ignore_glob = ["test_*.py"]
