// ==UserScript==
// @name         IDE LUA
// @namespace    http://tampermonkey1.net/
// @version      1.91
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
                "getArgs", "getArgsTable", "addMessage", "edit", "setData", "getData"            ];

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

        // Ajouter le bouton pour basculer entre CodeMirror et textarea
        const toggleButton = document.createElement('button');
        toggleButton.textContent = 'Activer/Désactiver CodeMirror'; // Texte du bouton
        toggleButton.style.position = 'absolute'; // Positionnement absolu
        toggleButton.style.top = '60px'; // Position verticale
        toggleButton.style.right = '10px'; // Position horizontale
        toggleButton.style.zIndex = '9999'; // Assurer que le bouton est au-dessus de tout
        toggleButton.style.padding = '10px'; // Espacement interne
        toggleButton.style.backgroundColor = '#007bff'; // Couleur de fond du bouton
        toggleButton.style.color = 'white'; // Couleur du texte
        toggleButton.style.border = 'none'; // Pas de bordure
        toggleButton.style.borderRadius = '5px'; // Coins arrondis
        toggleButton.style.cursor = 'pointer'; // Curseur en main

        // Événement pour basculer l'affichage de CodeMirror et du textarea
        toggleButton.addEventListener('click', function() {
            if (editorDiv.style.display === 'none') {
                editorDiv.style.display = 'block'; // Afficher CodeMirror
                textarea.style.display = 'none'; // Masquer le textarea
                toggleButton.textContent = 'Désactiver CodeMirror'; // Mettre à jour le texte du bouton
            } else {
                editorDiv.style.display = 'none'; // Masquer CodeMirror
                textarea.style.display = 'block'; // Afficher le textarea
                toggleButton.textContent = 'Activer CodeMirror'; // Mettre à jour le texte du bouton
            }
        });

        // Ajouter le bouton à la page
        document.body.appendChild(toggleButton);

        // Ajouter le bouton pour aller chercher les mises à jour
        const updateButton = document.createElement('button');
        updateButton.textContent = 'Vérifier les mises à jour'; // Texte du bouton
        updateButton.style.position = 'absolute'; // Positionnement absolu
        updateButton.style.top = '110px'; // Position verticale
        updateButton.style.right = '10px'; // Position horizontale
        updateButton.style.zIndex = '9999'; // Assurer que le bouton est au-dessus de tout
        updateButton.style.padding = '10px'; // Espacement interne
        updateButton.style.backgroundColor = '#28a745'; // Couleur de fond du bouton
        updateButton.style.color = 'white'; // Couleur du texte
        updateButton.style.border = 'none'; // Pas de bordure
        updateButton.style.borderRadius = '5px'; // Coins arrondis
        updateButton.style.cursor = 'pointer'; // Curseur en main

        // Événement pour vérifier les mises à jour
        updateButton.addEventListener('click', function() {
            window.open('https://raw.githubusercontent.com/octador/srcipt-LUA-IDE/main/violentMonkey.js', '_blank'); // Ouvrir la page des mises à jour
        });

        // Ajouter le bouton à la page
        document.body.appendChild(updateButton);

        // Ajouter le bouton pour formater le code
        const formatButton = document.createElement('button');
        formatButton.textContent = 'Formater le code'; // Texte du bouton
        formatButton.style.position = 'absolute'; // Positionnement absolu
        formatButton.style.top = '150px'; // Position verticale
        formatButton.style.right = '10px'; // Position horizontale
        formatButton.style.zIndex = '9999'; // Assurer que le bouton est au-dessus de tout
        formatButton.style.padding = '10px'; // Espacement interne
        formatButton.style.backgroundColor = '#ffc107'; // Couleur de fond du bouton
        formatButton.style.color = 'black'; // Couleur du texte
        formatButton.style.border = 'none'; // Pas de bordure
        formatButton.style.borderRadius = '5px'; // Coins arrondis
        formatButton.style.cursor = 'pointer'; // Curseur en main

        // Événement pour formater le code
        formatButton.addEventListener('click', function() {
            const code = editor.getValue(); // Récupérer le code actuel
            const formattedCode = formatLuaCode(code); // Formater le code Lua
            editor.setValue(formattedCode); // Mettre à jour le code formaté dans CodeMirror
        });

        // Fonction pour formater le code Lua
        function formatLuaCode(code) {
            // Logiciel de formatage simple (vous pouvez l'améliorer)
            const lines = code.split('\n'); // Diviser le code en lignes
            const indent = '    '; // Indentation de 4 espaces
            const formattedLines = lines.map(line => {
                // Retirer les espaces en trop et ajouter l'indentation
                return line.trim().replace(/^\s+/g, '').replace(/(\s*[\(\{])\s*/g, '$1').replace(/\s*(\}\))/g, '$1');
            });

            return formattedLines.join('\n').replace(/^\s+/g, indent); // Rejoindre les lignes formatées
        }

        // Ajouter le bouton à la page
        document.body.appendChild(formatButton);
    }

    // Vérifier si CodeMirror est déjà initialisé pour éviter les duplications
    if (!editor) {
        initializeCodeMirror(); // Appeler la fonction d'initialisation
    }
})(); 