import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ReconhecimentoFacial } from "./ReconhecimentoFacial";
import { IdentificacaoEmMassa } from "./IdentificacaoEmMassa";

/**
 * App Component
 * Gerencia as rotas principais da aplicação de Reconhecimento Facial.
 */
function App() {
  return (
    <Router>
      <Routes>
        {/* Rota Principal: Cadastro e Validação Individual */}
        <Route path="/" element={<ReconhecimentoFacial />} />
        
        {/* Rota de Identificação em Massa: Identifica várias pessoas ao mesmo tempo */}
        <Route path="/massa" element={<IdentificacaoEmMassa />} />
      </Routes>
    </Router>
  );
}

export default App;