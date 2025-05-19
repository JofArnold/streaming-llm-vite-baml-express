import './App.css';
import { useResume } from './useResume';

const resume = `
  Vaibhav Gupta
  vbv@boundaryml.com

  Experience:
  - Founder at BoundaryML
  - CV Engineer at Google
  - CV Engineer at Microsoft

  Skills:
  - Rust
  - C++
`;

function App() {
  const { run, data } = useResume();

  return (
    <div className="App">
      <code>{JSON.stringify(data, null, 2)}</code>
      <button onClick={() => run(resume)}>Run</button>
    </div>
  );
}

export default App;
