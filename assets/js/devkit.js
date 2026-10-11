// Host adapter only. The renderer is owned and tested by clang-engineer/devkit.
async function start() {
  try { await import('../devkit-runtime/index.js'); }
  catch {
    const root = document.querySelector('[data-devkit]');
    if (!root) return;
    root.innerHTML = '<p role="alert">도구 탐색 화면을 불러오지 못했습니다.</p><button type="button" data-reload>새로고침</button><p><a href="https://github.com/clang-engineer/devkit/tree/main/reference/cheatsheets">치트시트 원본 보기</a></p>';
    root.querySelector('[data-reload]').addEventListener('click', () => location.reload());
  }
}
start();
