"""
State machine for Quote lifecycle.
"""
from .business_state_rules import BusinessObjectState, StateTransitionError, log_state_transition, validate_transition

class QuoteStateMachine:
    def __init__(self, quote_id, state: BusinessObjectState):
        self.quote_id = quote_id
        self.state = state

    def can_transition(self, to_state: BusinessObjectState) -> bool:
        try:
            validate_transition("Quote", self.state.name.lower(), to_state.name.lower())
            return True
        except ValueError:
            return False

    def transition(self, to_state: BusinessObjectState, reason=None):
        try:
            validate_transition("Quote", self.state.name.lower(), to_state.name.lower())
        except ValueError as e:
            log_state_transition('Quote', self.quote_id, self.state, to_state, False, reason)
            raise StateTransitionError(str(e))

        log_state_transition('Quote', self.quote_id, self.state, to_state, True, reason)
        self.state = to_state
