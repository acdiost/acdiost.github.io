console.log("Dawn`s Blog");

document.addEventListener("DOMContentLoaded", function () {
    const menuToggle = document.getElementById("menu-toggle");
    const menu = document.querySelector(".menu");

    if (menuToggle && menu) {
        menuToggle.addEventListener("click", function () {
            menu.classList.toggle("hidden");
        });
    }

    const codeBlocks = document.querySelectorAll("pre");

    codeBlocks.forEach(function (pre) {
        if (pre.closest(".code-block-wrapper")) {
            return;
        }

        const code = pre.querySelector("code");
        const textToCopy = code ? code.innerText : pre.innerText;

        if (!textToCopy.trim()) {
            return;
        }

        const wrapper = document.createElement("div");
        wrapper.className = "code-block-wrapper";

        const button = document.createElement("button");
        button.type = "button";
        button.className = "code-copy-button";
        button.setAttribute("aria-label", "复制代码");
        button.textContent = "复制";

        button.addEventListener("click", async function () {
            const originalLabel = button.textContent;

            try {
                if (navigator.clipboard && window.isSecureContext) {
                    await navigator.clipboard.writeText(textToCopy);
                } else {
                    const textarea = document.createElement("textarea");
                    textarea.value = textToCopy;
                    textarea.setAttribute("readonly", "");
                    textarea.style.position = "absolute";
                    textarea.style.left = "-9999px";
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand("copy");
                    document.body.removeChild(textarea);
                }

                button.textContent = "已复制";
                button.classList.add("is-copied");
            } catch (error) {
                console.error("Failed to copy code block", error);
                button.textContent = "复制失败";
            }

            window.setTimeout(function () {
                button.textContent = originalLabel;
                button.classList.remove("is-copied");
            }, 1800);
        });

        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(button);
        wrapper.appendChild(pre);
    });
});
