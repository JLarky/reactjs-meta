import { useState } from "react";
import reactLogo from "./assets/react.svg";
import { MetaProvider, Title } from "./lib";
import "./App.css";

const pages = ["/", "/about", "/dashboard", "/dashboard/extra"] as const;
type Pages = typeof pages[number];

function App() {
  const hash = location.hash.slice(1) as Pages | undefined;
  const initialPage = (hash && pages.includes(hash) && hash) || "/";
  const [page, setPage] = useState(initialPage);

  return (
    <div className="App">
      <MetaProvider>
        <Title>App wide title</Title>
        <h1>Testing our component</h1>
        <nav>
          <ul>
            {pages.map((p) => (
              <li key={p}>
                <a href={"#" + p} onClick={() => setPage(p)}>
                  {p === "/" ? "Home" : p.replace(/\//g, " ")}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <TopLevel page={page} />
      </MetaProvider>
    </div>
  );
}

let increment = () => {};
const w = window as typeof window & { t: any };
w.t = w.t || setInterval(() => increment(), 1000);

const TopLevel = ({ page }: { page: Pages }) => {
  const [show, setShow] = useState(true);
  const [count, setCount] = useState(0);
  increment = () => setCount((c) => c + 1);
  if (page === "/") {
    return <div>At Home</div>;
  }
  if (page === "/about") {
    return (
      <div>
        <Title>{count}: About title</Title>
        At Home
      </div>
    );
  }
  return (
    <div>
      {show && <Title>Dashboard</Title>}
      Dashboard
      <button onClick={() => setShow(!show)}>Toggle</button>
      {page === "/dashboard/extra" && <DashboardExtra />}
    </div>
  );
};

const DashboardExtra = () => {
  return (
    <div>
      <Title>Extra Dashboard</Title>
      Dashboard Extra
    </div>
  );
};

export default App;
