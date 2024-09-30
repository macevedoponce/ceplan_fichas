document.addEventListener('DOMContentLoaded', () => {
    // Elementos del DOM
    const fileInput = document.getElementById('dropzone-file');
    const processButton = document.getElementById('process-button');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const dropzone = document.getElementById('dropzone');
    const copyParagraphsButton = document.getElementById('copy-paragraphs-button');
    const copyReferencesButton = document.getElementById('copy-references-button');
    const themeToggleSwitch = document.getElementById('theme-toggle-switch');
    const dot = document.querySelector('.dot');
    const htmlElement = document.documentElement;
    // Elementos de Tabs
    const tabParagraphs = document.getElementById('tab-paragraphs');
    const tabFigures = document.getElementById('tab-figures');
    const tabReferences = document.getElementById('tab-references');

    // Contenedores de Contenido
    const contentParagraphs = document.getElementById('content-paragraphs');
    const contentFigures = document.getElementById('content-figures');
    const contentReferences = document.getElementById('content-references');

    // Función para Mostrar/Ocultar Contenido de Tabs
    function showTabContent(tab, content) {
        // Ocultar todos los contenidos
        contentParagraphs.classList.add('hidden');
        contentFigures.classList.add('hidden');
        contentReferences.classList.add('hidden');

        // Quitar estilos activos de todos los tabs
        tabParagraphs.classList.remove('text-blue-600', 'dark:text-blue-400', 'border-blue-600', 'dark:border-blue-400');
        tabFigures.classList.remove('text-blue-600', 'dark:text-blue-400', 'border-blue-600', 'dark:border-blue-400');
        tabReferences.classList.remove('text-blue-600', 'dark:text-blue-400', 'border-blue-600', 'dark:border-blue-400');

        // Mostrar el contenido seleccionado
        content.classList.remove('hidden');

        // Aplicar estilo activo al tab seleccionado
        tab.classList.add('text-blue-600', 'dark:text-blue-400', 'border-blue-600', 'dark:border-blue-400');
    }

    // Eventos de los Tabs
    tabParagraphs.addEventListener('click', () => showTabContent(tabParagraphs, contentParagraphs));
    tabFigures.addEventListener('click', () => showTabContent(tabFigures, contentFigures));
    tabReferences.addEventListener('click', () => showTabContent(tabReferences, contentReferences));

    // Mostrar el contenido inicial
    showTabContent(tabParagraphs, contentParagraphs);
    
    // Inicializar tema basado en la preferencia almacenada
    if (localStorage.getItem('theme') === 'light') {
        htmlElement.classList.remove('dark');
        themeToggleSwitch.checked = false;
        dot.style.transform = 'translateX(0)';
    } else {
        htmlElement.classList.add('dark');
        themeToggleSwitch.checked = true;
        dot.style.transform = 'translateX(100%)';
    }

    // Evento de cambio de tema
    themeToggleSwitch.addEventListener('change', () => {
        if (themeToggleSwitch.checked) {
            htmlElement.classList.add('dark');
            dot.style.transform = 'translateX(100%)';
            localStorage.setItem('theme', 'dark');
        } else {
            htmlElement.classList.remove('dark');
            dot.style.transform = 'translateX(0)';
            localStorage.setItem('theme', 'light');
        }
    });

            

    // Prevenir el comportamiento predeterminado en todos los eventos del dropzone
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Evento para copiar el contenido de la sección de párrafos
    copyParagraphsButton.addEventListener('click', () => {
        const contentDiv = document.getElementById('content');
        if (contentDiv) {
            // Seleccionar todo el contenido HTML de los párrafos
            const paragraphsHtml = Array.from(contentDiv.querySelectorAll('.paragraph-card p'))
                .map(p => p.innerHTML) // Usar innerHTML para incluir los enlaces y el formato
                .join('\n\n'); // Unir párrafos con saltos de línea en HTML

            // Copiar el contenido HTML al portapapeles
            copyToClipboard(paragraphsHtml);
        }
    });

    // Evento para copiar el contenido de la sección de referencias
    copyReferencesButton.addEventListener('click', () => {
        const referencesDiv = document.getElementById('references');
        if (referencesDiv) {
            // Seleccionar todo el contenido HTML de las referencias
            const referencesHtml = Array.from(referencesDiv.querySelectorAll('.reference-card p'))
                .map(p => p.innerHTML) // Usar innerHTML para incluir los enlaces y el formato
                .join('\n\n'); // Unir referencias con saltos de línea en HTML

            // Copiar el contenido HTML al portapapeles
            copyToClipboard(referencesHtml);
        }
    });

    // Validación de existencia de elementos
    if (!fileInput || !processButton || !progressBar || !progressText || !dropzone) {
        console.error('Algunos elementos del DOM no se han encontrado.');
        return;
    }

    // Evento para el botón de procesar
    processButton.addEventListener('click', processDocx);

    // Función para procesar el documento
    async function processDocx() {
        if (fileInput.files.length === 0) {
            alert('Por favor, suba un documento .docx.');
            return;
        }

        const file = fileInput.files[0];

        try {
            // Mostrar mensaje de carga
            updateProgress(10); // Iniciar con 10% de progreso
            const arrayBuffer = await file.arrayBuffer();

            // Comienza la extracción de texto usando mammoth.js
            mammoth.extractRawText({ arrayBuffer: arrayBuffer })
                .then(result => {
                    const content = result.value;
                    const parsedContent = parseContent(content);
                    displayContent(parsedContent);
                    updateProgress(100); // Simular progreso completo
                })
                .catch(err => {
                    console.error('Error al procesar el documento .docx:', err);
                    alert('Error al procesar el documento .docx.');
                    updateProgress(0); // Reiniciar progreso
                });
        } catch (error) {
            console.error('Error al leer el archivo .docx:', error);
            alert('Error al leer el archivo .docx.');
            updateProgress(0); // Reiniciar progreso
        }
    }

    // Actualizar barra de progreso
    function updateProgress(value) {
        progressBar.style.width = `${value}%`;
        progressText.textContent = `Progreso: ${value}%`;
    }

    // Eventos para el dropzone
    dropzone.addEventListener('click', () => fileInput.click());

    dropzone.addEventListener('dragover', (e) => {
        dropzone.classList.add('bg-blue-50', 'border-blue-400');
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('bg-blue-50', 'border-blue-400');
    });

    dropzone.addEventListener('drop', (e) => {
        dropzone.classList.remove('bg-blue-50', 'border-blue-400');
        const files = e.dataTransfer.files;

        // Verificar si es un archivo .docx antes de actualizar el input
        if (files.length > 0 && files[0].type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
            fileInput.files = files; // Asigna el archivo al input
            updateDropzoneText(); // Actualiza el nombre del archivo en el dropzone
        } else {
            alert("Por favor, cargue un archivo .docx");
        }
    });

    // Manejador de evento para el cambio de archivo en el input
    fileInput.addEventListener('change', (event) => {
        const files = event.target.files;

        if (files.length > 0) {
            console.log('Archivo detectado:', files[0].name);
            updateDropzoneText(); // Actualiza el nombre del archivo en el dropzone
        } else {
            console.log('No se detectó ningún archivo.');
        }
    });

    // Función para actualizar el texto del dropzone
    function updateDropzoneText() {
        const fileName = fileInput.files.length ? fileInput.files[0].name : 'Arrastra y suelta el archivo aquí o haz clic para seleccionar';
        dropzone.querySelector('p').textContent = fileName;

        // Mensaje de consola para verificar
        console.log('Nombre de archivo actualizado en dropzone:', fileName);
    }

    // Función para parsear el contenido del documento
    function parseContent(content) {
        const referencePattern = /\[(\d+(?:,\s*\d+)*)\]/g; // Patrón para detectar referencias múltiples como [9, 10, 11]
        const references = {}; // Almacenar las URLs de las referencias
        let contentFlow = []; // Array para almacenar el contenido con el orden natural
    
        let isTableContent = false; // Variable para rastrear si estamos dentro de una tabla
        let captureNextAsNote = false; // Variable para capturar el siguiente párrafo como nota de la figura
        let skipNextParagraph = false; // Variable para omitir el siguiente párrafo en la sección de párrafos
    
        // Suponemos que la sección de referencias comienza con "Referencias" en el texto
        const refSectionStart = content.toLowerCase().indexOf("referencias");
        if (refSectionStart === -1) {
            alert('No se encontró la sección de Referencias en el documento.');
            return { contentFlow: [], references: [], figures: [] };
        }
    
        const refSection = content.substring(refSectionStart);
    
        const refLines = refSection.split('\n').filter(line => line.trim() !== '');
    
        // Procesar referencias considerando que la URL podría estar en la siguiente línea
        const fullReferences = []; // Array para almacenar las referencias completas
        let currentReference = ""; // Variable para acumular el contenido de la referencia actual
        let currentNumber = ""; // Variable para almacenar el número de referencia actual
    
        for (let i = 0; i < refLines.length; i++) {
            const line = refLines[i].trim();
    
            // Verificar si la línea comienza con una referencia nueva
            const refMatch = line.match(/^\[(\d+)\]\s*(.*)$/);
            if (refMatch) {
                if (currentReference !== "" && currentNumber !== "") {
                    // Si ya hay una referencia acumulada, agregarla al array
                    fullReferences.push({ number: currentNumber, content: currentReference });
                }
                // Iniciar nueva referencia
                currentNumber = refMatch[1];
                currentReference = `[${refMatch[1]}] ${refMatch[2]}`;
            } else if (line.length > 0) {
                // Si la línea no es vacía, añadirla a la referencia actual
                currentReference += " " + line;
            }
    
            // Verificar si la línea contiene una URL
            const urlMatch = line.match(/(https?:\/\/[^\s]+)/);
            if (urlMatch && currentNumber) {
                references[currentNumber] = urlMatch[0];
            }
        }
    
        // Agregar la última referencia si existe
        if (currentReference !== "" && currentNumber !== "") {
            fullReferences.push({ number: currentNumber, content: currentReference });
        }
    
        // Eliminar "Available:" de las referencias y limpiar el formato
        fullReferences.forEach(ref => {
            ref.content = ref.content.replace("Available:", "").trim(); // Reemplazar y limpiar
    
            // Eliminar el último carácter si es un punto
            if (ref.content.endsWith(".")) {
                ref.content = ref.content.slice(0, -1); // Eliminar el último carácter
            }
        });
    
        // Eliminar el último carácter de las URLs de las referencias si terminan en un punto
        Object.keys(references).forEach(key => {
            if (references[key].endsWith(".")) {
                references[key] = references[key].slice(0, -1); // Eliminar el último carácter de la URL
            }
        });
    
        let processedText = content.substring(0, refSectionStart);
    
        // Procesar contenido línea por línea para mantener el orden natural
        processedText.split(/\n{2,}/).forEach((paragraph, index, lines) => {
            const trimmedParagraph = paragraph.trim();
    
            // Detectar inicio de tabla y tratarlo como figura
            if (trimmedParagraph.toLowerCase().match(/^tabla\s+\d+/)) {
                isTableContent = true; // Comienza contenido de la tabla
                captureNextAsNote = true; // Esperar el siguiente párrafo como nota
                contentFlow.push({
                    type: 'figure',
                    content: trimmedParagraph, // Tratar el primer párrafo de descripción de la tabla como figura
                    note: "" // Inicialmente, sin nota
                });
                return; // Continuar al siguiente párrafo
            }
    
            // Capturar el siguiente párrafo como nota si es necesario
            if (captureNextAsNote && trimmedParagraph.toLowerCase().includes("nota")) {
                if (contentFlow.length > 0 && contentFlow[contentFlow.length - 1].type === 'figure') {
                    // Agregar la nota a la última figura agregada
                    contentFlow[contentFlow.length - 1].note = trimmedParagraph;
                }
                captureNextAsNote = false; // Restablecer la variable
                isTableContent = false; // Fin de la tabla
                skipNextParagraph = false; // Marcar para omitir el siguiente párrafo en la sección de párrafos
                return; // Continuar al siguiente párrafo
            }
    
            // Omitir el siguiente párrafo si es la nota que ya se agregó a la figura
            if (skipNextParagraph) {
                skipNextParagraph = false; // Restablecer la variable después de omitir
                return; // Omitir este párrafo
            }
    
            // Si no estamos dentro de una tabla y el párrafo no es omitido, procesarlo normalmente
            if (!isTableContent) {
                // Detectar si el párrafo comienza con "Figura" seguido de un número.
                if (trimmedParagraph.match(/^figura\s+\d+/i)) {
                    let note = "";
    
                    // Verificar si la siguiente línea contiene una nota
                    const nextLine = lines[index + 1] || "";
                    if (nextLine.toLowerCase().includes("nota")) {
                        note = nextLine.trim();
                    }
    
                    contentFlow.push({
                        type: 'figure',
                        content: trimmedParagraph,
                        note: note
                    });
                    skipNextParagraph = true; // Omitir el siguiente párrafo si es la nota que ya se agregó
                } else if (trimmedParagraph !== "") {
                    // Si no comienza con "Figura", tratar como un párrafo normal
                    contentFlow.push({
                        type: 'paragraph',
                        content: trimmedParagraph
                    });
                }
            }
        });
    
        // Reemplazar referencias en el contenido principal
        contentFlow = contentFlow.map(item => {
            if (item.type === 'paragraph') {
                item.content = item.content.replace(referencePattern, (match, refNumbers) => {
                    // Separar referencias múltiples en un array
                    const separateRefs = refNumbers.split(',').map(num => num.trim());
                    // Crear un enlace separado para cada referencia
                    return separateRefs.map(refNumber => {
                        const refUrl = references[refNumber] || '#';
                        return `<a href="${refUrl}" target="_blank">[${refNumber}]</a>`;
                    }).join(' '); // Unir todas las referencias separadas por un espacio
                });
            }
            return item;
        });
    
        return { contentFlow: contentFlow, references: fullReferences };
    }

    // Función para mostrar el contenido procesado en el HTML
    function displayContent(parsedContent) {
        const contentDiv = document.getElementById('content');
        const referencesDiv = document.getElementById('references');
        const figuresDiv = document.getElementById('figures');
    
        // Limpiar contenido anterior
        contentDiv.innerHTML = '';
        referencesDiv.innerHTML = '';
        figuresDiv.innerHTML = '';
    
        let paragraphOrder = 1; // Orden inicial para los párrafos
    
        // Mostrar contenido en el orden natural con tarjetas elegantes y botones mejorados
        parsedContent.contentFlow.forEach(item => {
            if (item.type === 'paragraph') {
                // Crear una tarjeta para el párrafo
                const paragraphCard = document.createElement('div');
                paragraphCard.classList.add('paragraph-card', 'p-6', 'mb-6', 'rounded-lg', 'shadow-md', 'border', 'border-gray-200', 'dark:border-gray-700', 'bg-white', 'dark:bg-gray-800', 'transition', 'hover:shadow-lg', 'hover:bg-gray-50', 'dark:hover:bg-gray-700');
    
                const paragraphHeader = document.createElement('div');
                paragraphHeader.classList.add('flex', 'justify-between', 'items-center', 'mb-4');
    
                const paragraphOrderLabel = document.createElement('span');
                paragraphOrderLabel.classList.add('text-gray-700', 'dark:text-gray-400', 'font-semibold');
                paragraphOrderLabel.textContent = `Párrafo ${paragraphOrder}:`;
    
                const copyButton = document.createElement('button');
                copyButton.innerHTML = `
                    <span class="flex items-center space-x-2">
                        <svg class="w-5 h-5 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" stroke-linejoin="round" stroke-width="2" d="M9 8v3a1 1 0 0 1-1 1H5m11 4h2a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-7a1 1 0 0 0-1 1v1m4 3v10a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7.13a1 1 0 0 1 .24-.65L7.7 8.35A1 1 0 0 1 8.46 8H13a1 1 0 0 1 1 1Z"/>
                        </svg>
                    </span>
                `;
                copyButton.classList.add('p-2', 'rounded', 'hover:bg-gray-200', 'dark:hover:bg-gray-600', 'focus:outline-none', 'transition', 'duration-200', 'ease-in-out', 'tooltip');
                copyButton.setAttribute('title', 'Copiar párrafo');
                copyButton.addEventListener('click', () => {
                    copyToClipboard(item.content);
    
                    // Cambiar el texto a "Copiado" temporalmente
                    const originalText = copyButton.innerHTML;
                    copyButton.innerHTML = `
                        <span class="flex items-center space-x-2">
                            <svg class="w-5 h-5 text-green-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <path stroke="currentColor" stroke-linejoin="round" stroke-width="2" d="M16.707 4.293a1 1 0 01.083 1.32l-.083.094-8 8a1 1 0 01-1.32.083l-.094-.083-4-4a1 1 0 011.32-1.497l.094.083L8 11.585l7.293-7.292a1 1 0 011.414 0z" clip-rule="evenodd" />
                            </svg>
                        </span>
                    `;
                    copyButton.setAttribute('title', 'Copiado');
    
                    // Revertir después de 1.5 segundos
                    setTimeout(() => {
                        copyButton.innerHTML = originalText;
                        copyButton.setAttribute('title', 'Copiar párrafo');
                    }, 1500);
                });
    
                paragraphHeader.appendChild(paragraphOrderLabel);
                paragraphHeader.appendChild(copyButton);
    
                const paragraphContent = document.createElement('p');
                paragraphContent.classList.add('text-gray-700', 'dark:text-gray-300', 'leading-relaxed');
                paragraphContent.innerHTML = item.content;
    
                paragraphCard.appendChild(paragraphHeader);
                paragraphCard.appendChild(paragraphContent);
                contentDiv.appendChild(paragraphCard);
    
                paragraphOrder++;
            }
    
            if (item.type === 'figure') {
                // Crear una tarjeta para la figura
                const figureCard = document.createElement('div');
                figureCard.classList.add('figure-card', 'p-6', 'mb-6', 'rounded-lg', 'shadow-md', 'border', 'border-gray-200', 'dark:border-gray-700', 'bg-white', 'dark:bg-gray-800', 'transition', 'hover:shadow-lg', 'hover:bg-gray-50', 'dark:hover:bg-gray-700');
    
                const figureHeader = document.createElement('div');
                figureHeader.classList.add('flex', 'justify-between', 'items-center', 'mb-4');
    
                const figureOrderLabel = document.createElement('span');
                figureOrderLabel.classList.add('text-gray-700', 'dark:text-gray-400', 'font-semibold');
                figureOrderLabel.textContent = `Figura ${paragraphOrder - 1}:`;
    
                const copyFigureButton = document.createElement('button');
                copyFigureButton.innerHTML = `
                    <span class="flex items-center space-x-2">
                        <svg class="w-5 h-5 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" stroke-linejoin="round" stroke-width="2" d="M9 8v3a1 1 0 0 1-1 1H5m11 4h2a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-7a1 1 0 0 0-1 1v1m4 3v10a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7.13a1 1 0 0 1 .24-.65L7.7 8.35A1 1 0 0 1 8.46 8H13a1 1 0 0 1 1 1Z"/>
                        </svg>
                    </span>
                `;
                copyFigureButton.classList.add('p-2', 'rounded', 'hover:bg-gray-200', 'dark:hover:bg-gray-600', 'focus:outline-none', 'transition', 'duration-200', 'ease-in-out', 'tooltip');
                copyFigureButton.setAttribute('title', 'Copiar figura');
                copyFigureButton.addEventListener('click', () => {
                    copyToClipboard(item.content);
    
                    // Cambiar el texto a "Copiado" temporalmente
                    const originalText = copyFigureButton.innerHTML;
                    copyFigureButton.innerHTML = `
                        <span class="flex items-center space-x-2">
                            <svg class="w-5 h-5 text-green-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <path stroke="currentColor" stroke-linejoin="round" stroke-width="2" d="M16.707 4.293a1 1 0 01.083 1.32l-.083.094-8 8a1 1 0 01-1.32.083l-.094-.083-4-4a1 1 0 011.32-1.497l.094.083L8 11.585l7.293-7.292a1 1 0 011.414 0z" clip-rule="evenodd" />
                            </svg>
                        </span>
                    `;
                    copyFigureButton.setAttribute('title', 'Copiado');
    
                    // Revertir después de 1.5 segundos
                    setTimeout(() => {
                        copyFigureButton.innerHTML = originalText;
                        copyFigureButton.setAttribute('title', 'Copiar figura');
                    }, 1500);
                });
    
                figureHeader.appendChild(figureOrderLabel);
                figureHeader.appendChild(copyFigureButton);
    
                const figureContent = document.createElement('p');
                figureContent.classList.add('text-gray-700', 'dark:text-gray-300', 'leading-relaxed');
                figureContent.innerHTML = item.content;
    
                figureCard.appendChild(figureHeader);
                figureCard.appendChild(figureContent);
    
                if (item.note) {
                    const noteDiv = document.createElement('div');
                    noteDiv.classList.add('mt-4', 'p-4', 'rounded-lg', 'bg-gray-50', 'dark:bg-gray-700', 'transition', 'hover:bg-gray-100', 'dark:hover:bg-gray-600'); // Corregido el color del hover
    
                    const noteHeader = document.createElement('div');
                    noteHeader.classList.add('flex', 'justify-between', 'items-center', 'mb-2');
    
                    const noteOrderLabel = document.createElement('span');
                    noteOrderLabel.classList.add('text-gray-500', 'dark:text-gray-400', 'italic');
                    noteOrderLabel.textContent = `Nota ${paragraphOrder - 1}:`;
    
                    const copyNoteButton = document.createElement('button');
                    copyNoteButton.innerHTML = `
                        <span class="flex items-center space-x-2">
                            <svg class="w-5 h-5 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <path stroke="currentColor" stroke-linejoin="round" stroke-width="2" d="M9 8v3a1 1 0 0 1-1 1H5m11 4h2a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-7a1 1 0 0 0-1 1v1m4 3v10a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7.13a1 1 0 0 1 .24-.65L7.7 8.35A1 1 0 0 1 8.46 8H13a1 1 0 0 1 1 1Z"/>
                            </svg>
                            <span>Copiar Nota</span>
                        </span>
                    `;
                    copyNoteButton.classList.add('p-2', 'rounded', 'hover:bg-gray-200', 'dark:hover:bg-gray-600', 'focus:outline-none', 'transition', 'duration-200', 'ease-in-out', 'tooltip');
                    copyNoteButton.setAttribute('title', 'Copiar nota');
                    copyNoteButton.addEventListener('click', () => {
                        copyToClipboard(item.note);
    
                        // Cambiar el texto a "Copiado" temporalmente
                        const originalText = copyNoteButton.innerHTML;
                        copyNoteButton.innerHTML = `
                            <span class="flex items-center space-x-2">
                                <svg class="w-5 h-5 text-green-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <path stroke="currentColor" stroke-linejoin="round" stroke-width="2" d="M16.707 4.293a1 1 0 01.083 1.32l-.083.094-8 8a1 1 0 01-1.32.083l-.094-.083-4-4a1 1 0 011.32-1.497l.094.083L8 11.585l7.293-7.292a1 1 0 011.414 0z" clip-rule="evenodd" />
                                </svg>
                                <span>Copiado</span>
                            </span>
                        `;
                        copyNoteButton.setAttribute('title', 'Copiado');
    
                        // Revertir después de 1.5 segundos
                        setTimeout(() => {
                            copyNoteButton.innerHTML = originalText;
                            copyNoteButton.setAttribute('title', 'Copiar nota');
                        }, 1500);
                    });
    
                    noteHeader.appendChild(noteOrderLabel);
                    noteHeader.appendChild(copyNoteButton);
    
                    const noteContent = document.createElement('p');
                    noteContent.classList.add('text-gray-700', 'dark:text-gray-300', 'leading-relaxed');
                    noteContent.innerHTML = item.note;
    
                    noteDiv.appendChild(noteHeader);
                    noteDiv.appendChild(noteContent);
                    figureCard.appendChild(noteDiv);
                }
    
                figuresDiv.appendChild(figureCard);
            }
        });
    
        // Mostrar referencias completas sin orden, con botón de copiar
        parsedContent.references.forEach(ref => {
            const referenceCard = document.createElement('div');
            referenceCard.classList.add('reference-card', 'p-6', 'mb-6', 'rounded-lg', 'shadow-md', 'border', 'border-gray-200', 'dark:border-gray-700', 'bg-white', 'dark:bg-gray-800', 'transition', 'hover:shadow-lg', 'hover:bg-gray-50', 'dark:hover:bg-gray-700');
    
            const referenceHeader = document.createElement('div');
            referenceHeader.classList.add('flex', 'justify-between', 'items-center', 'mb-4');
    
            const referenceLabel = document.createElement('span');
            referenceLabel.classList.add('text-gray-700', 'dark:text-gray-400', 'font-semibold');
            referenceLabel.textContent = `Referencia:`;
    
            const copyButton = document.createElement('button');
            copyButton.innerHTML = `
                <span class="flex items-center space-x-2">
                    <svg class="w-5 h-5 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <path stroke="currentColor" stroke-linejoin="round" stroke-width="2" d="M9 8v3a1 1 0 0 1-1 1H5m11 4h2a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-7a1 1 0 0 0-1 1v1m4 3v10a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7.13a1 1 0 0 1 .24-.65L7.7 8.35A1 1 0 0 1 8.46 8H13a1 1 0 0 1 1 1Z"/>
                    </svg>
                </span>
            `;
            copyButton.classList.add('p-2', 'rounded', 'hover:bg-gray-200', 'dark:hover:bg-gray-600', 'focus:outline-none', 'transition', 'duration-200', 'ease-in-out', 'tooltip');
            copyButton.setAttribute('title', 'Copiar referencia');
            copyButton.addEventListener('click', () => {
                copyToClipboard(ref.content);
    
                // Cambiar el texto a "Copiado" temporalmente
                const originalText = copyButton.innerHTML;
                copyButton.innerHTML = `
                    <span class="flex items-center space-x-2">
                        <svg class="w-5 h-5 text-green-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" stroke-linejoin="round" stroke-width="2" d="M16.707 4.293a1 1 0 01.083 1.32l-.083.094-8 8a1 1 0 01-1.32.083l-.094-.083-4-4a1 1 0 011.32-1.497l.094.083L8 11.585l7.293-7.292a1 1 0 011.414 0z" clip-rule="evenodd" />
                        </svg>
                    </span>
                `;
                copyButton.setAttribute('title', 'Copiado');
    
                // Revertir después de 1.5 segundos
                setTimeout(() => {
                    copyButton.innerHTML = originalText;
                    copyButton.setAttribute('title', 'Copiar referencia');
                }, 1500);
            });
    
            referenceHeader.appendChild(referenceLabel);
            referenceHeader.appendChild(copyButton);
    
            const referenceContent = document.createElement('p');
            referenceContent.classList.add('text-gray-700', 'dark:text-gray-300', 'leading-relaxed');
            referenceContent.innerHTML = ref.content;
    
            referenceCard.appendChild(referenceHeader);
            referenceCard.appendChild(referenceContent);
            referencesDiv.appendChild(referenceCard);
        });
    }
    

    function copyToClipboard(html) {
        const tempTextArea = document.createElement('textarea');
        tempTextArea.value = html;
        document.body.appendChild(tempTextArea);
        tempTextArea.select();
        document.execCommand('copy');
        document.body.removeChild(tempTextArea);

        // Mostrar mensaje para informar que el texto se copió
        showToast('Contenido copiado al portapapeles');
    }
    
    // Función para mostrar un toast de confirmación
    function showToast(message) {
        const toastContainer = document.getElementById('toast-container') || document.createElement('div');
        
        if (!document.getElementById('toast-container')) {
            toastContainer.id = 'toast-container';
            toastContainer.style.position = 'fixed';
            toastContainer.style.bottom = '20px';
            toastContainer.style.right = '20px';
            document.body.appendChild(toastContainer);
        }

        // Crear un nuevo toast
        const toast = document.createElement('div');
        toast.classList.add('toast', 'bg-blue-500', 'text-white', 'p-3', 'rounded-lg', 'shadow-lg', 'flex', 'items-center', 'space-x-2', 'transition', 'duration-300', 'opacity-0', 'transform', 'translate-y-4');
        toast.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M16.707 4.293a1 1 0 01.083 1.32l-.083.094-8 8a1 1 0 01-1.32.083l-.094-.083-4-4a1 1 0 011.32-1.497l.094.083L8 11.585l7.293-7.292a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
            <span>${message}</span>
        `;

        // Agregar el toast al contenedor
        toastContainer.appendChild(toast);

        // Mostrar el toast
        setTimeout(() => {
            toast.classList.remove('opacity-0', 'translate-y-4');
            toast.classList.add('opacity-100', 'translate-y-0');
        }, 100);

        // Ocultar el toast después de 3 segundos
        setTimeout(() => {
            toast.classList.remove('opacity-100', 'translate-y-0');
            toast.classList.add('opacity-0', 'translate-y-4');
            setTimeout(() => {
                toast.remove(); // Eliminar el toast del DOM
            }, 300);
        }, 3000);
    }
    
});
