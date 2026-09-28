FROM rust:1.90-slim-bookworm

RUN apt-get update -qq \
    && apt-get install -y -qq curl ca-certificates python3 >/dev/null \
    && rm -rf /var/lib/apt/lists/* \
    && curl -LsSf https://astral.sh/uv/install.sh | sh

ENV PATH="/root/.local/bin:${PATH}"
WORKDIR /work
COPY . .

RUN set -eux; \
    python3 scripts/check_rust_packaging.py; \
    echo PINK_RUST_PACKAGING_SMOKE_PASS

CMD ["sh", "-c", "echo PINK_RUST_PACKAGING_RUNTIME && sleep 60"]
