"""
API layer: route modules (deliberately shallow adapters).

Each module parses a request, calls a service through the provider seam in
`deps.py`, and maps errors to HTTP responses. No business logic lives here.
"""
