// エントリポイント。起動シーケンスのみを持つ(REQ-004)。
import "./ui/styles.css";
import { mountApp } from "./ui/app";

const app = document.querySelector<HTMLDivElement>("#app");
if (app) {
  mountApp(app);
}
