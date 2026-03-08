# Implementação Backend: Reconhecimento Facial em Larga Escala

Para transformar uma POC de navegador em um sistema robusto e escalável, a lógica de comparação e armazenamento deve ser movida para o **Backend**, utilizando bancos de dados otimizados para vetores.

---

## 1. Arquitetura de Armazenamento (Híbrida)

A melhor prática é separar a **imagem (corpo)** da **identidade matemática (alma/vetor)**.

### O que salvar e onde?
*   **Imagens (Arquivos):** Devem ser armazenadas em um **Object Storage** (AWS S3, Google Cloud Storage ou Firebase Storage). No banco, salvamos apenas a **URL** da foto.
*   **Metadados (Texto):** Nome, e-mail e outros dados cadastrais vão em colunas comuns (VARCHAR, TEXT).
*   **Biometria (Vetores):** O *Descriptor* de 128 números deve ser salvo em uma coluna do tipo **vector** (disponível via extensão no PostgreSQL).

---

## 2. Estrutura da Tabela (PostgreSQL com pgvector)

Utilizando a extensão `pgvector`, o banco de dados passa a entender cálculos de distância euclidiana de forma nativa e extremamente rápida.

```sql
-- 1. Habilitar a extensão de vetores
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Criar a tabela de biometria
CREATE TABLE usuarios_biometria (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    
    -- O "DNA" facial: vetor de 128 números gerado pela face-api.js
    face_descriptor vector(128) NOT NULL, 
    
    -- Link para a foto original no S3/Storage
    url_foto_referencia TEXT, 
    
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 3. O Fluxo de Busca (Identificação 1:N)

Diferente de uma verificação simples (onde você sabe quem é o usuário e só valida), na identificarão o sistema precisa "vasculhar" todo o banco para achar o dono do rosto.

### A Query de Escaneamento:
Quando um novo rosto é capturado pela câmera, a API envia o vetor recebido para o banco realizar a busca por proximidade:

```sql
-- O operador <-> calcula a "Distância Euclidiana" no motor do banco
SELECT 
    nome, 
    email, 
    url_foto_referencia, 
    (face_descriptor <-> '[0.12, -0.04, 0.88, ...]') AS distancia
FROM usuarios_biometria
ORDER BY distancia ASC
LIMIT 1;
```

### Regra de Negócio:
*   **Se `distancia < 0.45`:** Usuário Identificado com sucesso.
*   **Se `distancia > 0.45`:** Rosto desconhecido ou acesso negado.

---

## 4. Por que não vetorizar a imagem inteira?
Vetorizar fotos completas (pixels por pixels) é útil para buscas visuais genéricas (Ex: Google Lens). Para **reconhecimento facial**, o seu "resumo" já é o *Descriptor*. Ele é otimizado para ignorar fundos, cores de roupas ou luz, focando apenas na geometria óssea do rosto, o que torna a busca muito mais precisa e barata computacionalmente.

---

## 5. Resumo da Estratégia
1.  **Frontend:** Captura a imagem e gera o descriptor.
2.  **API:** Recebe o descriptor e faz a query `ORDER BY <->` no Postgres.
3.  **Postgres:** Retorna o registro mais próximo em milissegundos.
4.  **Backend:** Valida se a distância retornada está dentro da margem de segurança e libera o acesso.

*Este guia fornece a base técnica para suportar de centenas a milhões de biometrias sem perda de performance.*
