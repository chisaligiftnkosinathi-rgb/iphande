import pytest
from src.services.template_variable_resolver import resolve_template_variables

def test_missing_variables_raise_value_error():
    template = {
        "template_key": "test_missing_var",
        "variables": ["location", "service_name"],
        "hook_pattern": "Looking for {service_name} in {location}?"
    }
    context = {"location": "Durban"}  # Missing service_name

    with pytest.raises(ValueError, match="Missing required variables"):
        resolve_template_variables(template, context)

def test_variables_resolve_without_placeholder_leakage():
    template = {
        "template_key": "test_leakage",
        "variables": ["customer_name", "location"],
        "hook_pattern": "Hello {customer_name} from {location}!",
        "body_pattern": "We are ready in {location}.",
        "cta_pattern": "Book {customer_name} today."
    }
    context = {"customer_name": "Sipho", "location": "Durban"}

    resolved = resolve_template_variables(template, context)

    assert resolved["hook_pattern"] == "Hello Sipho from Durban!"
    assert "{" not in resolved["body_pattern"] and "}" not in resolved["body_pattern"]
