/* Shared citation and copy controls for the homepage and leaderboard. */
(function () {
  "use strict";

  const bibtex = `@article{yang2026bench2dex,
  title={Bench2Dex: Benchmarking Visuo-Tactile Bimanual Dexterous Manipulation Across Dexterous Hands},
  author={Yang, Zhenjie and Zhang, Yideng and Zhang, Dongjie and Jiang, Chenyu and Liu, Xianshuai and Li, Yufeng and Ge, Zuhao and Jiao, Xingyu and Zhang, Zheng and He, Kaiyu and others},
  journal={arXiv preprint arXiv:2609.15726},
  year={2026}
}`;

  const pre = document.querySelector("#bibtex");
  const toast = document.querySelector("#copy-toast");

  // 将引用内容显示到网页中。
  if (pre) {
    pre.textContent = bibtex;
  }

  let toastTimer;

  document.querySelectorAll("[data-copy-bib]").forEach((button) => {
    const label = button.textContent;
    let buttonTimer;

    button.addEventListener("click", async () => {
      let copied = false;

      try {
        await navigator.clipboard.writeText(bibtex);
        copied = true;
      } catch {
        // Clipboard API 不可用时，尝试原有的复制回退方案。
        const field = document.createElement("textarea");
        field.value = bibtex;
        field.style.cssText =
          "position:fixed;top:0;left:0;opacity:0;pointer-events:none;";

        document.body.append(field);
        field.focus();
        field.select();

        try {
          copied = document.execCommand("copy");
        } catch {
          copied = false;
        } finally {
          field.remove();
          button.focus({ preventScroll: true });
        }
      }

      clearTimeout(buttonTimer);
      clearTimeout(toastTimer);

      button.textContent = copied ? "Copied!" : label;

      buttonTimer = setTimeout(() => {
        button.textContent = label;
      }, 1800);

      if (toast) {
        toast.textContent = copied
          ? "BibTeX copied"
          : "Copy unavailable. Select the citation below.";

        toast.classList.add("show");

        toastTimer = setTimeout(() => {
          toast.classList.remove("show");
        }, copied ? 1800 : 4000);
      }

      // 自动复制失败时，展开并选中引用，方便手动复制。
      if (!copied && pre) {
        const fallback = pre.closest("details");

        if (fallback) {
          fallback.hidden = false;
          fallback.open = true;
        }

        pre.scrollIntoView({ block: "center" });
        pre.focus({ preventScroll: true });

        const selection = window.getSelection();

        if (selection) {
          const range = document.createRange();
          range.selectNodeContents(pre);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
    });
  });
})();