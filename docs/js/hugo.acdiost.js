document.addEventListener("DOMContentLoaded", function () {
    const menuToggle = document.getElementById("menu-toggle");
    const menu = document.querySelector(".menu");

    if (menuToggle && menu) {
        const setMenuExpanded = function (expanded) {
            menu.classList.toggle("hidden", !expanded);
            menuToggle.setAttribute("aria-expanded", String(expanded));
            menuToggle.setAttribute("aria-label", expanded ? "关闭导航" : "打开导航");
        };

        menuToggle.addEventListener("click", function () {
            setMenuExpanded(menuToggle.getAttribute("aria-expanded") !== "true");
        });

        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
                setMenuExpanded(false);
                menuToggle.focus();
            }
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
        const defaultLabel = "复制";
        button.textContent = defaultLabel;
        let resetTimeout;

        const status = document.createElement("span");
        status.className = "code-copy-status sr-only";
        status.setAttribute("role", "status");
        status.setAttribute("aria-live", "polite");
        status.setAttribute("aria-atomic", "true");

        button.addEventListener("click", async function () {
            if (button.disabled) {
                return;
            }

            window.clearTimeout(resetTimeout);
            button.disabled = true;
            button.classList.remove("is-copied");
            status.textContent = "正在复制代码";
            let restoreFocus = false;

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
                    try {
                        textarea.select();
                        if (!document.execCommand("copy")) {
                            throw new Error("Copy command failed");
                        }
                    } finally {
                        document.body.removeChild(textarea);
                        restoreFocus = true;
                    }
                }

                button.textContent = "已复制";
                button.classList.add("is-copied");
                status.textContent = "代码已复制到剪贴板";
            } catch (error) {
                console.error("Failed to copy code block", error);
                button.textContent = "复制失败";
                status.textContent = "复制失败，请手动选择并复制代码";
            } finally {
                button.disabled = false;
                if (restoreFocus) {
                    button.focus({ preventScroll: true });
                }
            }

            resetTimeout = window.setTimeout(function () {
                button.textContent = defaultLabel;
                button.classList.remove("is-copied");
                status.textContent = "";
            }, 1800);
        });

        pre.parentNode.insertBefore(wrapper, pre);
        wrapper.appendChild(button);
        wrapper.appendChild(status);
        wrapper.appendChild(pre);
    });
});
