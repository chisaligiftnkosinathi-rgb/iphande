import time
import os
import redis
from src.utils.redis_config import get_redis_client
from src.simulations.drift_simulator import drift_simulator
from src.simulations.scenarios.demand_spike import DemandSpikeScenario
from src.simulations.scenarios.fraud_burst import FraudBurstScenario
from src.simulations.scenarios.geo_cluster import GeoClusterScenario
from src.simulations.scenarios.trust_shock import TrustShockScenario

scenarios_map = {
    "demand_spike": DemandSpikeScenario(),
    "fraud_burst": FraudBurstScenario(),
    "geo_cluster": GeoClusterScenario(),
    "trust_shock": TrustShockScenario()
}

def start_simulation_worker():
    print("Starting Simulation Worker...")
    r = get_redis_client()
    
    while True:
        try:
            active = r.get("simulation:active") == "true"
            
            if active:
                scenario_name = r.get("simulation:current_scenario") or "demand_spike"
                scenario = scenarios_map.get(scenario_name, scenarios_map["demand_spike"])
                
                print(f"[Simulation Worker] Executing Burst: {scenario_name}")
                drift_simulator.run(scenario)
                
            time.sleep(30) # Burst every 30 seconds
            
        except Exception as e:
            print(f"[Simulation Worker] Error: {e}")
            time.sleep(10)

if __name__ == "__main__":
    start_simulation_worker()
