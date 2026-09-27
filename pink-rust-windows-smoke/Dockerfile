FROM rust:1.90-bookworm

ARG UV_VERSION=0.12.19

RUN dpkg --add-architecture i386 \
    && apt-get update -qq \
    && apt-get install -y -qq python3 python3-pip mingw-w64 wine wine32:i386 unzip curl ca-certificates >/dev/null \
    && pip3 install --break-system-packages -q maturin \
    && rustup target add x86_64-pc-windows-gnu \
    && curl -fsSL -o /tmp/uv-win.zip "https://releases.astral.sh/github/uv/releases/download/${UV_VERSION}/uv-x86_64-pc-windows-msvc.zip" \
    && mkdir -p /opt/uv-win \
    && unzip -q /tmp/uv-win.zip -d /opt/uv-win \
    && rm -rf /var/lib/apt/lists/* /tmp/uv-win.zip

WORKDIR /work
COPY Cargo.toml pyproject.toml ./
COPY src ./src

RUN set -eux; \
    maturin build --release --target x86_64-pc-windows-gnu --out /tmp/dist; \
    wheel="$(find /tmp/dist -maxdepth 1 -name 'pink-*-win_amd64.whl' -print -quit)"; \
    test -n "$wheel"; \
    uvexe="$(find /opt/uv-win -name uv.exe -print -quit)"; \
    test -n "$uvexe"; \
    export WINEDEBUG=-all; \
    export WINEPREFIX=/tmp/wine-prefix; \
    wineboot --init; \
    wine "$uvexe" --version; \
    export UV_TOOL_DIR='Z:\tmp\uv-tools-win'; \
    export UV_TOOL_BIN_DIR='Z:\tmp\uv-bin-win'; \
    export UV_CACHE_DIR='Z:\tmp\uv-cache-win'; \
    export UV_PYTHON_INSTALL_DIR='Z:\tmp\uv-python-win'; \
    wine "$uvexe" python install 3.13; \
    winwheel="$(winepath -w "$wheel")"; \
    wine "$uvexe" tool install --python 3.13 --force "$winwheel"; \
    test -f /tmp/uv-bin-win/pink.exe; \
    test "$(wine /tmp/uv-bin-win/pink.exe --version | tr -d '\r')" = "pink 0.9.0"; \
    expected='{"package":"pink","executable":"pink","runtime":"rust","version":"0.9.0"}'; \
    test "$(wine /tmp/uv-bin-win/pink.exe packaging-smoke --json | tr -d '\r')" = "$expected"; \
    wine "$uvexe" tool uninstall pink; \
    test ! -e /tmp/uv-bin-win/pink.exe; \
    echo PINK_RUST_WINDOWS_WINE_SMOKE_PASS

CMD ["sh", "-c", "echo PINK_RUST_WINDOWS_WINE_RUNTIME && sleep 60"]
