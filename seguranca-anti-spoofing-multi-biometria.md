# Segurança Avançada: Anti-Spoofing e Multi-Biometria

Para transformar um sistema de reconhecimento facial em uma ferramenta de segurança confiável, é necessário lidar com tentativas de fraude (fotos, vídeos) e melhorar a precisão através do uso de múltiplas capturas.

---

## 1. Anti-Spoofing (Liveness Detection - Prova de Vida)

Diferente de sistemas de hardware (como o FaceID da Apple), a biblioteca `face-api.js` **não possui** um sistema nativo de anti-spoofing. Ela reconhece rostos em fotos e telas com a mesma facilidade que rostos reais.

### Como Implementar Prova de Vida em Software?
Para garantir que a pessoa está "viva" e presente, utilizamos os **68 Face Landmarks** (pontos faciais) para criar desafios em tempo real:

*   **Detecção de Piscada:** Monitoramos as coordenadas dos olhos (pontos 37-48). Se a distância vertical entre as pálpebras diminuir drasticamente e voltar ao normal, detectamos uma piscada.
*   **Desafio de Movimento (Challenge-Response):** O sistema solicita uma ação aleatória (Ex: "Vire a cabeça para a esquerda", "Sorria"). Usamos a posição do nariz e da boca para validar se o usuário executou o movimento solicitado.
*   **Análise de Textura:** IAs secundárias (como o MobileNet) podem ser treinadas para detectar o brilho característico de uma tela digital ou a borda de uma foto impressa, bloqueando o acesso.

---

## 2. Treinamento com Múltiplas Imagens (Multi-Biometria)

Salvar apenas um descriptor para cada pessoa pode gerar falhas se a iluminação mudar ou se a pessoa estiver em um ângulo diferente. Aumentamos a precisão salvando um **conjunto de biometrias**.

### Por que usar mais de uma foto?
*   **Ângulos Variados:** Cadastrar o rosto de frente, perfil esquerdo e perfil direito garante que o sistema te reconheça mesmo que você não esteja olhando diretamente para a câmera.
*   **Luz e Acessórios:** Capturar biometrias em diferentes luzes ou com/sem óculos reduz a taxa de "Falso Rejeitado" (quando o sistema não reconhece o dono legítimo).

### Como estruturar no Banco de Dados?
Em um banco de vetores (Postgres + `pgvector`), em vez de um relacionamento 1:1, usamos um relacionamento **1:N**:

1.  Um único **Usuário** possui várias linhas na tabela de **Biometria**.
2.  Cada linha contém um `face_descriptor` (vetor de 128 números) diferente.
3.  **Na Busca:** O sistema procura o descriptor mais próximo de **qualquer um** dos descriptors salvos para aquele usuário. Se o "melhor match" estiver abaixo do threshold, o acesso é liberado.

---

## 3. Resumo Técnico de Implementação

| Desafio | Solução Sugerida | Ferramenta |
| :--- | :--- | :--- |
| **Foto/Vídeo Fake** | Prova de vida (piscada/movimento) | Face Landmarks (pontos 1-68) |
| **Ângulo Difícil** | Cadastrar 3 a 5 descriptors por pessoa | LabeledFaceDescriptors / pgvector |
| **Iluminação Ruim** | Normalização de imagem ou múltiplas capturas | Pré-processamento com Canvas / CSS |

---

## 4. Conclusão de Segurança

> O reconhecimento facial por si só é uma ferramenta de **identificação**. O Anti-spoofing é a ferramenta de **autenticação**. Um sistema de produção robusto deve combinar ambos para garantir que o "DNA Digital" pertence a um ser humano vivo fisicamente presente no local.

---
*Documento focado em segurança e precisão para sistemas de biometria facial.*
