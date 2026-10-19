from app.main import app

def test_required_routes_registered():
    routes = {(next(iter(route.methods)) if len(route.methods) == 1 else "MULTI", route.path) for route in app.routes if hasattr(route, "methods")}
    for method, path in [("POST", "/api/chat/session"), ("POST", "/api/chat/message"), ("POST", "/api/chat/escalate"), ("POST", "/api/availability/search")]:
        assert (method, path) in routes
