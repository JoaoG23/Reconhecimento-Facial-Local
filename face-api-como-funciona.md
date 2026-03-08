A biblioteca `face-api.js` é uma ferramenta incrível porque ela traz modelos de **Deep Learning** complexos (que normalmente rodariam apenas em servidores potentes) para dentro do seu navegador, utilizando **TensorFlow.js**.

Aqui está o "passo a passo" do que acontece por trás dos panos quando você clica em validar:

### 1. O Pipeline de Três Camadas

Para identificar uma pessoa, a biblioteca não olha para a "foto completa". Ela executa três redes neurais distintas em sequência:

* **Camada 1: Detecção (SSD MobileNet V1)**
  * O algoritmo varre os pixels da imagem procurando por padrões que definam um rosto humano.
  * Ele ignora o fundo e foca apenas no "quadrado" onde o rosto está. No seu código, usamos o `ssdMobilenetv1`, que é o modelo mais preciso disponível na lib.
* **Camada 2: Pontos de Referência (Face Landmarks - 68 pontos)**
  * Uma vez achado o rosto, a IA identifica 68 pontos específicos: o contorno da mandíbula, sobrancelhas, olhos, nariz e boca.
  * **Por que isso é importante?** Isso serve para "alinhar" o rosto. Se você estiver com a cabeça levemente inclinada, a IA usa esses pontos para rotacionar virtualmente o seu rosto e deixá-lo "de frente" para a próxima etapa.
* **Camada 3: Extração de Características (Face Recognition Net)**
  * Aqui é onde a mágica acontece. A IA analisa as proporções únicas (distância entre os olhos, largura do nariz, profundidade do queixo, etc.).
  * O resultado disso **não é uma imagem**, mas sim um **vetor de 128 números** (chamado de *Face Descriptor* ou *Embedding*).

### 2. A "Identidade" é um Array de Números

Quando você salva um usuário, você não está salvando a foto dele no `localStorage`. Você está salvando uma **assinatura matemática**.
Imagine que o seu rosto, para a IA, seja algo como: `[0.12, -0.05, 0.88, ...]` (128 números).

### 3. A Matemática da Comparação (Distância Euclidiana)

Quando você tenta validar, a IA gera um **novo** array de 128 números do seu rosto atual. Agora, ela precisa saber: "Este rosto novo é o mesmo que eu salvei antes?".

Para isso, ela usa a **Distância Euclidiana**:

* Imagine cada array de 128 números como um ponto num mapa de 128 dimensões.
* Se os dois pontos estiverem muito **próximos** (distância curta), é a mesma pessoa.
* Se estiverem **longe**, é outra pessoa.

No seu código, definimos o `THRESHOLD = 0.45`:

* Se a "distância" for menor que `0.45`, a IA tem confiança de que é você.
* Quanto menor esse número, mais rigorosa (e segura) é a validação.

### 4. Onde roda o processamento?

Tudo isso acontece na **GPU (Placa de Vídeo)** do seu computador ou celular, via WebGL. Por isso que, na primeira vez que você abre a página, demora um pouco para "Carregar IA...", pois o navegador está baixando os pesos das redes neurais e preparando a aceleração de hardware.

**Resumo da Ópera:** A lib transforma carne e osso em geometria, e geometria em álgebra. Comparar rostos é, no fim das contas, apenas subtrair números!
