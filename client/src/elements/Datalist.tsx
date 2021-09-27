import { useSelector } from "react-redux";
import { StoreState } from "../store";

export function Datalist() {
  const datalist = useSelector((state: StoreState) => state.notes.datalist);
  return (
    <datalist id="emailDatalist">
      {datalist.map((str) => (
        <option value={str} key={str} />
      ))}
    </datalist>
  );
}
