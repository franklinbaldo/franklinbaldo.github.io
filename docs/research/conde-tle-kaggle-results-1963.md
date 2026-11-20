# Auditoria executada no Kaggle: elementos históricos de 1963

Data: 10/11/2026. Execução privada: https://www.kaggle.com/code/franklinbaldo/conde-1963-historical-tle-audit

- Fonte: https://huggingface.co/datasets/oxzoid/space-track-tle-history/resolve/main/data/tle_1963.parquet
- SHA-256 do Parquet: `c4bf072a8fc1084506a6146ec79f97d8f8a918fdbe2fabdd16e8cc077f3ddc09`
- Linhas totais: **4.567**.
- NORAD **527**: **21 registros** em 1963, de 17/01 02:07 UTC a 17/12 05:43 UTC (último repetido).
- NORAD **528**: **45 registros**, de 17/01 16:18 UTC a **27/10 14:40 UTC**.
- NORAD **529**: **57 registros**, de 17/01 16:20 UTC a **30/12 11:25 UTC** (há épocas duplicadas).

**Resultado crítico:** nesta cópia do arquivo de 1963 não há nenhum TLE do NORAD 528 posterior a 27 de outubro. Portanto não foi recuperada a posição orbital próxima à reentrada de 8/11; a busca em arquivos independentes segue necessária.

O 529 tem TLEs em 28/10, 31/10, 01/11, 02/11 e 05/11/1963. Eles são **do objeto 529, não observações do 528**. Podem ajudar na comparação de condições gerais, não na recuperação direta da fase do 528.

Os registros do 528 anteriores a 27/10 permitem estudar a consistência temporal do movimento médio e testar modelos de arrasto, reservando registros para validação independente. Nenhuma longitude de reentrada foi determinada.

**Limitações:** os dados vêm de um espelho público que afirma derivar de Space-Track. A lista de TLEs não necessariamente contém todo o rastreamento militar histórico, e a ausência de entradas não comprova ausência de observação original. Um TLE é uma representação média sem matriz de covariância publicada.

A auditoria remota usou Jatobá como ponte e Kaggle como executor porque DuckDB/Parquet excedeu o orçamento de RAM local. Saída `conde-1963-tle-results.json` preservada no output da execução privada do Kaggle. Nenhum token Hugging Face foi requerido para o espelho público.
