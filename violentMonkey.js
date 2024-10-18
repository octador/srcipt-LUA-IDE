// ==UserScript==
// @name         Coloration Syntaxique pour MediaWiki avec CodeMirror
// @namespace    http://tampermonkey.net/
// @version      1.7
// @description  Applique une coloration syntaxique avec CodeMirror dans MediaWiki avec gestion de la touche Tab, auto-complétion améliorée, et mise en forme automatique
// @author       octador
// @match        https://www.flow-vivantes.eu/RocketToMars/index.php?title=Module:*&action=edit
// @require      https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.5/codemirror.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.5/mode/javascript/javascript.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.5/mode/lua/lua.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.5/addon/hint/show-hint.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.5/addon/lint/lint.min.js
// @resource     codemirror_css https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.5/codemirror.min.css
// @resource     show_hint_css https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.5/addon/hint/show-hint.min.css
// @resource     lint_css https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.5/addon/lint/lint.min.css
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    // Ajouter le CSS de CodeMirror et des addons
    GM_addStyle('@import url("https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.5/codemirror.min.css");');
    GM_addStyle('@import url("https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.5/addon/hint/show-hint.min.css");');
    GM_addStyle('@import url("https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.5/addon/lint/lint.min.css");');
    GM_addStyle('.CodeMirror { height: 435px !important; font-size: 14px !important; }'); // Ajuste la hauteur et la taille de police
    GM_addStyle('.CodeMirror-activeline { background: #e0e0e0 !important; }'); // Surbrillance de la ligne active

    let editorDiv, editor;

    // Fonction pour initialiser CodeMirror
    function initializeCodeMirror() {
        const textarea = document.getElementById('wpTextbox1');
        if (!textarea) return; // Vérifie que le textarea existe

        editorDiv = document.createElement('div');
        editorDiv.style.width = '100%'; // Ajuste la largeur ici

        // Insérer le div avant le textarea et masquer le textarea
        textarea.parentNode.insertBefore(editorDiv, textarea);
        textarea.style.display = 'none';

        // Initialiser CodeMirror avec gestion de la touche Tab, auto-complétion et coloration syntaxique
        editor = CodeMirror(editorDiv, {
            lineNumbers: true,
            mode: 'lua', // Mode de coloration syntaxique pour Lua
            value: textarea.value,
            theme: 'default', // Changez le thème ici (e.g. 'monokai', 'dracula')
            tabSize: 4,
            indentWithTabs: true, // Utiliser des tabulations pour indenter
            styleActiveLine: true, // Surbrillance de la ligne active
            lineWrapping: true, // Retour à la ligne automatique
            extraKeys: {
                "Ctrl-Space": "autocomplete", // Active l'auto-complétion avec Ctrl+Espace
                "Tab": function(cm) {
                    if (cm.somethingSelected()) {
                        cm.indentSelection("add"); // Indenter la sélection
                    } else {
                        cm.replaceSelection("    ", "end"); // Ajouter une tabulation
                    }
                },
                "Shift-Tab": function(cm) {
                    cm.indentSelection("subtract"); // Désindenter si Shift+Tab
                }
            }
        });

        // Ajouter des suggestions d'auto-complétion personnalisées
        CodeMirror.registerHelper("hint", "lua", function(cm) {
            const keywords = ["function", "end", "if", "then", "else", "elseif", "for", "in", "do", "while", "repeat", "until", "local", "return", "require", "module"];
            const cur = cm.getCursor();
            const token = cm.getTokenAt(cur);
            const start = token.start;
            const word = token.string;

            const list = keywords.filter(function(item) {
                return item.startsWith(word) && word.length > 0; // Vérifiez que le mot n'est pas vide
            }).map(function(item) {
                return {text: item, displayText: item}; // Utilisation de text et displayText
            });

            return {
                list: list,
                from: CodeMirror.Pos(cur.line, start),
                to: CodeMirror.Pos(cur.line, token.end)
            };
        });

        // Ajouter l'auto-complétion automatique
        editor.on("inputRead", function(cm) {
            const cursor = cm.getCursor();
            const token = cm.getTokenAt(cursor);
            if (token.string.length > 0) { // Assurez-vous qu'il y a quelque chose à compléter
                cm.showHint({completeSingle: false}); // Affichez l'auto-complétion
            }
        });

        // Synchroniser le CodeMirror avec le textarea d'origine
        editor.on('change', function(instance) {
            textarea.value = instance.getValue();
        });

        // Mettre à jour la valeur initiale du CodeMirror lorsque la page est chargée
        editor.setValue(textarea.value);

        // Ajouter le bouton pour basculer entre CodeMirror et textarea
        const toggleButton = document.createElement('button');
        toggleButton.textContent = 'Activer/Désactiver CodeMirror';
        toggleButton.style.position = 'absolute';
        toggleButton.style.top = '60px';
        toggleButton.style.right = '10px';
        toggleButton.style.zIndex = '9999'; // Assure que le bouton est au-dessus de tout
        toggleButton.style.padding = '10px';
        toggleButton.style.backgroundColor = '#007bff'; // Couleur de fond du bouton
        toggleButton.style.color = 'white'; // Couleur du texte
        toggleButton.style.border = 'none';
        toggleButton.style.borderRadius = '5px';
        toggleButton.style.cursor = 'pointer';

        toggleButton.addEventListener('click', function() {
            if (editorDiv.style.display === 'none') {
                editorDiv.style.display = 'block';
                textarea.style.display = 'none';
            } else {
                editorDiv.style.display = 'none';
                textarea.style.display = 'block';
            }
        });
        document.body.appendChild(toggleButton);

        // Ajouter le bouton de mise en forme
        const formatButton = document.createElement('button');
        formatButton.textContent = 'Mise en forme du code';
        formatButton.style.position = 'absolute';
        formatButton.style.top = '110px';
        formatButton.style.right = '10px';
        formatButton.style.zIndex = '9999'; // Assure que le bouton est au-dessus de tout
        formatButton.style.padding = '10px';
        formatButton.style.backgroundColor = '#28a745'; // Couleur de fond du bouton
        formatButton.style.color = 'white'; // Couleur du texte
        formatButton.style.border = 'none';
        formatButton.style.borderRadius = '5px';
        formatButton.style.cursor = 'pointer';

        formatButton.addEventListener('click', function() {
            // Appel à la fonction de mise en forme
            const formattedCode = formatLuaCode(editor.getValue()); // Formate le code
            editor.setValue(formattedCode); // Met à jour le contenu de l'éditeur
            editor.focus(); // Récupère le focus sur l'éditeur après mise en forme
        });
        document.body.appendChild(formatButton);
    }

    // Fonction pour formater le code Lua
    function formatLuaCode(code) {
        const lines = code.split('\n');
        const indentSize = 4; // Nombre d'espaces pour l'indentation
        let indentLevel = 0;
        let formattedLines = [];

        lines.forEach(line => {
            // Gérer l'indentation
            const trimmedLine = line.trim();

            // Applique l'indentation
            const indent = ' '.repeat(indentLevel * indentSize);
            formattedLines.push(indent + trimmedLine);

            // Augmente ou diminue le niveau d'indentation si nécessaire
            if (trimmedLine.endsWith('then') || trimmedLine.endsWith('do') || trimmedLine.endsWith('function')) {
                indentLevel++;
            }
            if (trimmedLine.startsWith('end')) {
                indentLevel = Math.max(0, indentLevel - 1);
            }
        });

        return formattedLines.join('\n');
    }

    // Attendre 1 seconde avant d'initialiser
    setTimeout(initializeCodeMirror, 200); // Initialisation différée de CodeMirror
})();
