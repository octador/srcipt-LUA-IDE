// ==UserScript==
// @name         IDE LUA
// @namespace    http://tampermonkey1.net/
// @version      2.2.2
// @description  Applique une coloration syntaxique avec CodeMirror dans MediaWiki avec gestion de la touche Tab, auto-complétion améliorée, mise en forme automatique, et vérification des mises à jour
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
// @updateURL    https://raw.githubusercontent.com/octador/srcipt-LUA-IDE/main/violentMonkey.js
// @downloadURL  https://raw.githubusercontent.com/octador/srcipt-LUA-IDE/main/violentMonkey.js
// ==/UserScript==

(function() {
    'use strict';

    // Ajouter les styles CSS de CodeMirror et de ses addons
    GM_addStyle('@import url("https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.5/codemirror.min.css");');
    GM_addStyle('@import url("https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.5/addon/hint/show-hint.min.css");');
    GM_addStyle('@import url("https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.5/addon/lint/lint.min.css");');
    GM_addStyle('.CodeMirror { height: 435px !important; font-size: 14px !important; }'); // Ajuster la hauteur et la taille de police
    GM_addStyle('.CodeMirror-activeline { background: #e0e0e0 !important; }'); // Surbrillance de la ligne active

    let editorDiv, editor;

    // Fonction pour initialiser CodeMirror
    function initializeCodeMirror() {
        const textarea = document.getElementById('wpTextbox1'); // Récupérer le textarea d'origine
        if (!textarea) return; // Vérifier que le textarea existe

        // Créer un div pour CodeMirror et le configurer
        editorDiv = document.createElement('div');
        editorDiv.style.width = '100%'; // Ajuster la largeur du div

        // Insérer le div avant le textarea et masquer le textarea
        textarea.parentNode.insertBefore(editorDiv, textarea);
        textarea.style.display = 'none';

        // Initialiser CodeMirror avec les options de configuration
        editor = CodeMirror(editorDiv, {
            lineNumbers: true, // Afficher les numéros de ligne
            mode: 'lua', // Mode de coloration syntaxique pour Lua
            value: textarea.value, // Valeur initiale du textarea
            theme: 'default', // Thème de CodeMirror
            tabSize: 4, // Taille de la tabulation
            indentWithTabs: true, // Utiliser des tabulations pour indenter
            styleActiveLine: true, // Surbrillance de la ligne active
            lineWrapping: true, // Retour à la ligne automatique
            extraKeys: {
                "Ctrl-Space": "autocomplete", // Activer l'auto-complétion avec Ctrl+Espace
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
            const keywords = [ // Liste de mots-clés pour l'auto-complétion
                "function", "end", "if", "then", "else", "elseif", "for", "in", "do", "while",
                "repeat", "until", "local", "return", "require", "module", "table", "true",
                "false", "nil", "and", "or", "not", "+", "-", "*", "/", "%", "==", "~=", "<",
                ">", "<=", ">=", "math", "string", "os", "io", "pairs", "ipairs", "table.insert",
                "table.remove", "table.concat", "setmetatable", "getmetatable", "pcall",
                "xpcall", "error", "mw", "mw.title", "mw.smw", "mw.language", "mw.message",
                "ask", "query", "property", "category", "template", "frame", "args", "title",
                "page", "getCurrentTitle", "getContent", "getNamespace", "getPage", "getRevision",
                "getArgs", "getArgsTable", "addMessage", "edit", "setData", "getData"];

            const cur = cm.getCursor(); // Récupérer la position du curseur
            const token = cm.getTokenAt(cur); // Récupérer le token à la position du curseur
            const start = token.start; // Début du token
            const word = token.string; // Chaîne de caractères du token

            // Filtrer les mots-clés qui commencent par le mot actuellement saisi
            const list = keywords.filter(function(item) {
                return item.startsWith(word) && word.length > 0; // Vérifier que le mot n'est pas vide
            }).map(function(item) {
                return {text: item, displayText: item}; // Utilisation de text et displayText
            });

            return {
                list: list,
                from: CodeMirror.Pos(cur.line, start), // Position de début pour l'auto-complétion
                to: CodeMirror.Pos(cur.line, token.end) // Position de fin pour l'auto-complétion
            };
        });

        // Ajouter l'auto-complétion automatique
        editor.on("inputRead", function(cm) {
            const cursor = cm.getCursor();
            const token = cm.getTokenAt(cursor);
            if (token.string.length > 0) { // Assurez-vous qu'il y a quelque chose à compléter
                cm.showHint({completeSingle: false}); // Afficher l'auto-complétion
            }
        });

        // Synchroniser le CodeMirror avec le textarea d'origine
        editor.on('change', function(instance) {
            textarea.value = instance.getValue(); // Mettre à jour la valeur du textarea
        });

        // Mettre à jour la valeur initiale du CodeMirror lorsque la page est chargée
        editor.setValue(textarea.value);

        // Ajouter le bouton pour formater le code
        const formatButton = document.createElement('button');
        formatButton.textContent = 'Formater le code Lua'; // Texte du bouton
        formatButton.style.position = 'fixed'; // Positionnement absolu
        formatButton.style.top = '100px'; // Position verticale
        formatButton.style.right = '10px'; // Position horizontale
        formatButton.style.zIndex = '9999'; // Assurer que le bouton est au-dessus de tout
        formatButton.style.padding = '5px'; // Espacement interne
        formatButton.style.backgroundColor = '#28a745'; // Couleur de fond du bouton
        formatButton.style.color = 'white'; // Couleur du texte
        formatButton.style.border = 'none'; // Pas de bordure
        formatButton.style.borderRadius = '8px'; // Coins arrondis
        formatButton.style.cursor = 'pointer'; // Curseur en main

        // Fonction pour formater le code Lua
        function formatLuaCode(code) {
            const lines = code.split('\n'); // Diviser le code en lignes
            const indent = '    '; // Indentation de 4 espaces
            let currentIndent = ''; // Indentation actuelle
            const formattedLines = []; // Tableau pour stocker les lignes formatées

            // Mots-clés qui ouvrent ou ferment des blocs en Lua
            const openBlockKeywords = ['function', 'if', 'for', 'while', 'repeat', '{'];
            const closeBlockKeywords = ['end', 'else', 'elseif', '}', 'until'];

            for (let line of lines) {
                // Supprimer les espaces inutiles au début de la ligne
                line = line.trim();

                // Gérer les ouvertures de blocs
                if (openBlockKeywords.some(keyword => line.startsWith(keyword))) {
                    formattedLines.push(currentIndent + line); // Ajouter la ligne formatée
                    currentIndent += indent; // Augmenter l'indentation
                } else if (closeBlockKeywords.some(keyword => line.startsWith(keyword))) {
                    currentIndent = currentIndent.slice(0, -indent.length); // Réduire l'indentation
                    formattedLines.push(currentIndent + line); // Ajouter la ligne formatée
                } else {
                    formattedLines.push(currentIndent + line); // Ajouter la ligne formatée
                }
            }
            return formattedLines.join('\n'); // Rejoindre les lignes formatées
        }

// Événement au clic sur le bouton pour formater le code
formatButton.addEventListener('click', function(event) {
    event.preventDefault(); // Empêcher le comportement par défaut
    const formattedCode = formatLuaCode(editor.getValue()); // Formater le code
    editor.setValue(formattedCode); // Mettre à jour le CodeMirror avec le code formaté
});
        // Ajouter le bouton de formatage au DOM
        editorDiv.parentNode.insertBefore(formatButton, editorDiv);

        // Ajouter le bouton pour vérifier les mises à jour
        const updateButton = document.createElement('button');
        updateButton.textContent = 'Vérifier les mises à jour'; // Texte du bouton
        updateButton.style.position = 'fixed'; // Positionnement absolu
        updateButton.style.top = '145px'; // Position verticale
        updateButton.style.right = '10px'; // Position horizontale
        updateButton.style.zIndex = '9999'; // Assurer que le bouton est au-dessus de tout
        updateButton.style.padding = '5px'; // Espacement interne
        updateButton.style.backgroundColor = '#007bff'; // Couleur de fond du bouton
        updateButton.style.color = 'white'; // Couleur du texte
        updateButton.style.border = 'none'; // Pas de bordure
        updateButton.style.borderRadius = '8px'; // Coins arrondis
        updateButton.style.cursor = 'pointer'; // Curseur en main

        // Événement pour le bouton de mise à jour
        updateButton.addEventListener('click', async function() {
            event.preventDefault();
            const response = await fetch('https://api.github.com/repos/octador/srcipt-LUA-IDE/releases/latest');
            const data = await response.json();
            const latestVersion = data.tag_name; // Dernière version disponible
            const currentVersion = GM_info.script.version; // Version actuelle

            if (latestVersion !== currentVersion) {
                alert(`Une nouvelle version (${latestVersion}) est disponible! Vous pouvez la mettre à jour à partir de ${data.html_url}`);
            } else {
                alert('Vous êtes à jour!');
            }
        });

        // Ajouter le bouton de mise à jour au DOM
        editorDiv.parentNode.insertBefore(updateButton, editorDiv);
    }

    // Initialiser CodeMirror après le chargement de la page
    window.addEventListener('load', initializeCodeMirror);
})();
