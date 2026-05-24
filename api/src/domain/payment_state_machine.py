"""
State machine for Payment Intent lifecycle.
"""
from .business_state_rules import BusinessObjectState, StateTransitionError, log_state_transition, validate_transition

class PaymentStateMachine:
    def __init__(self, payment_id, state: BusinessObjectState):
        self.payment_id = payment_id
        self.state = state

    def can_transition(self, to_state: BusinessObjectState) -> bool:
        try:
            validate_transition("PaymentIntent", self.state.name.lower(), to_state.name.lower())
            return True
        except ValueError:
            return False

    def transition(self, to_state: BusinessObjectState, reason=None):
        try:
            validate_transition("PaymentIntent", self.state.name.lower(), to_state.name.lower())
        except ValueError as e:
            log_state_transition('PaymentIntent', self.payment_id, self.state, to_state, False, reason)
            raise StateTransitionError(str(e))

        log_state_transition('PaymentIntent', self.payment_id, self.state, to_state, True, reason)
        self.state = to_state
