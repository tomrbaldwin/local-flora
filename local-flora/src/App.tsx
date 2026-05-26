import "./App.css";
import PlantMap from "./components/plant-map/PlantMap";

function App() {
  // GBIF taxonKey for Banksia serrata
  const taxonKey = 8144360;

  return (
    <>
      <PlantMap taxonKey={taxonKey} scientificName="Banksia serrata" />
    </>
  );
}

export default App;
