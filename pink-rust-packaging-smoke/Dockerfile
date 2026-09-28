FROM python:3.13-slim-bookworm

RUN apt-get update -qq \
    && apt-get install -y -qq curl ca-certificates >/dev/null \
    && rm -rf /var/lib/apt/lists/* \
    && curl -LsSf https://astral.sh/uv/install.sh | sh

ENV PATH="/root/.local/bin:${PATH}"
WORKDIR /work
COPY . .

RUN set -eux; \
    uv venv --python 3.13 /tmp/venv; \
    uv pip install --python /tmp/venv/bin/python /work/dist/pink-0.9.0-py3-none-any.whl; \
    /tmp/venv/bin/python scripts/generate_rust_golden.py --check --output /work/tests/golden/rust-port/phase0.json; \
    echo PINK_RUST_GOLDEN_PHASE0_PASS

CMD ["sh", "-c", "echo PINK_RUST_GOLDEN_PHASE0_RUNTIME && sleep 60"]
