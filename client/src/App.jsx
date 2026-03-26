import './App.css'
import Data from './components/Data'
import SimpleData from './components/SimpleData'
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/simple" element={<SimpleData />} />
        <Route path="/" element={<Data />}/>
        {/* <Route path="/" element={<SimpleData />}/> */}
      </Routes>
    </BrowserRouter>
    // <div>
    //   <Data></Data>
    // </div>
  )
}

export default App
