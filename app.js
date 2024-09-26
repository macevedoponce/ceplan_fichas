document.addEventListener('DOMContentLoaded', () => {
    // Elementos del DOM
    const fileInput = document.getElementById('dropzone-file');
    const processButton = document.getElementById('process-button');
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    const dropzone = document.getElementById('dropzone');
    const copyParagraphsButton = document.getElementById('copy-paragraphs-button');
    const copyReferencesButton = document.getElementById('copy-references-button');

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
        e.preventDefault();
        dropzone.classList.add('bg-blue-50', 'border-blue-400');
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('bg-blue-50', 'border-blue-400');
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('bg-blue-50', 'border-blue-400');
        fileInput.files = e.dataTransfer.files;
        updateDropzoneText();
    });

    //fileInput.addEventListener('change', updateDropzoneText);

    fileInput.addEventListener('change', (event) => {
        console.log('Evento change disparado.');
        const files = event.target.files;

        if (files.length > 0) {
            console.log('Archivo detectado en el primer clic:', files[0].name);
            updateDropzoneText(); // Actualiza el nombre del archivo en el dropzone
        } else {
            console.log('No se detectó ningún archivo en el primer clic.');
        }
    });
    
    function updateDropzoneText() {
        const fileName = fileInput.files.length ? fileInput.files[0].name : 'Arrastra y suelta el archivo aquí o haz clic para seleccionar';
        dropzone.querySelector('p').textContent = fileName;

        // Mensaje de consola para verificar
        console.log('Nombre de archivo actualizado en dropzone:', fileName);
    }

    // Restablecer el valor del input después de procesar el archivo
    function handleFileUpload(files) {
        if (files.length === 0) {
            console.error('No se seleccionó ningún archivo.');
            return;
        }

        // Procesar el archivo seleccionado
        const file = files[0];
        console.log('Procesando archivo:', file.name);

        // Aquí iría la lógica para procesar el archivo...

        // Después de procesar el archivo, restablecer el input
        fileInput.value = '';
        console.log('Input restablecido después de procesar el archivo.');
    }

    /*function updateDropzoneText() {
        const fileName = fileInput.files.length ? fileInput.files[0].name : 'Arrastra y suelta el archivo aquí o haz clic para seleccionar';
        dropzone.querySelector('p').textContent = fileName;
    }*/

    // Función para parsear el contenido del documento
    function parseContent(content) {
        const referencePattern = /\[(\d+)\]/g; // Patrón para detectar referencias [1], [2], etc.
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
                skipNextParagraph = true; // Marcar para omitir el siguiente párrafo en la sección de párrafos
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
                item.content = item.content.replace(referencePattern, (match, refNumber) => {
                    const refUrl = references[refNumber] || '#';
                    return `<a href="${refUrl}" target="_blank">[${refNumber}]</a>`;
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

        let order = 1; // Orden inicial

        // Mostrar contenido en el orden natural con orden y botón de copiar
        parsedContent.contentFlow.forEach(item => {
            if (item.type === 'paragraph') {
                const paragraphCard = document.createElement('div');
                paragraphCard.classList.add('paragraph-card', 'p-4', 'mb-4', 'rounded-lg', 'shadow', 'border', 'border-gray-300', 'dark:border-gray-700', 'transition', 'hover:shadow-lg', 'hover:bg-gray-100', 'dark:hover:bg-gray-800');
            
                const paragraphHeader = document.createElement('div');
                paragraphHeader.classList.add('flex', 'justify-between', 'items-center', 'mb-2');
            
                const paragraphOrder = document.createElement('span');
                paragraphOrder.classList.add('text-gray-500', 'dark:text-gray-400', 'font-semibold');
                paragraphOrder.textContent = `Orden ${order}:`;
            
                const copyButton = document.createElement('button');
                copyButton.innerHTML = `
                    <span class="flex items-center space-x-2">
                        <svg class="w-6 h-6 text-white dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" stroke-linejoin="round" stroke-width="2" d="M9 8v3a1 1 0 0 1-1 1H5m11 4h2a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-7a1 1 0 0 0-1 1v1m4 3v10a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7.13a1 1 0 0 1 .24-.65L7.7 8.35A1 1 0 0 1 8.46 8H13a1 1 0 0 1 1 1Z"/>
                        </svg>
                        <span>Copiar</span>
                    </span>
                `;
                copyButton.classList.add('bg-blue-500', 'text-white', 'flex', 'items-center', 'p-2', 'rounded', 'hover:bg-blue-600', 'active:bg-blue-700', 'transition', 'duration-200');
                copyButton.addEventListener('click', () => {
                    copyToClipboard(item.content);
                    
                    // Cambiar el texto a "Copiado" temporalmente
                    const originalText = copyButton.innerHTML;
                    copyButton.innerHTML = `
                        <span class="flex items-center space-x-2">
                            <svg class="w-6 h-6 text-white dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                                <path stroke="currentColor" stroke-linejoin="round" stroke-width="2" d="M16.707 4.293a1 1 0 01.083 1.32l-.083.094-8 8a1 1 0 01-1.32.083l-.094-.083-4-4a1 1 0 011.32-1.497l.094.083L8 11.585l7.293-7.292a1 1 0 011.414 0z" clip-rule="evenodd" />
                            </svg>
                            <span>Copiado</span>
                        </span>
                    `;
                    copyButton.classList.replace('bg-blue-500', 'bg-green-500'); // Cambiar el color de fondo temporalmente
                    
                    // Revertir después de 1.5 segundos
                    setTimeout(() => {
                        copyButton.innerHTML = originalText;
                        copyButton.classList.replace('bg-green-500', 'bg-blue-500'); // Restaurar el color de fondo
                    }, 1500);
                });

            
                paragraphHeader.appendChild(paragraphOrder);
                paragraphHeader.appendChild(copyButton);
            
                const paragraphContent = document.createElement('p');
                paragraphContent.classList.add('text-gray-800', 'dark:text-gray-300');
                paragraphContent.innerHTML = item.content;
            
                paragraphCard.appendChild(paragraphHeader);
                paragraphCard.appendChild(paragraphContent);
                contentDiv.appendChild(paragraphCard);
            
                order++; // Incrementar orden
            }
            

            if (item.type === 'figure') {
                const figureCard = document.createElement('div');
                figureCard.classList.add('figure-card', 'p-4', 'mb-4', 'rounded-lg', 'shadow', 'border', 'border-gray-300', 'dark:border-gray-700', 'transition', 'hover:shadow-lg', 'hover:bg-gray-100', 'dark:hover:bg-gray-800');
            
                const figureHeader = document.createElement('div');
                figureHeader.classList.add('flex', 'justify-between', 'items-center', 'mb-2');
            
                const figureOrder = document.createElement('span');
                figureOrder.classList.add('text-gray-500', 'dark:text-gray-400', 'font-semibold');
                figureOrder.textContent = `Orden ${order}:`;
            
                const copyFigureButton = document.createElement('button');
                copyFigureButton.innerHTML = `
                    <span class="flex items-center space-x-2">
                        <svg class="w-6 h-6 text-white dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" stroke-linejoin="round" stroke-width="2" d="M9 8v3a1 1 0 0 1-1 1H5m11 4h2a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-7a1 1 0 0 0-1 1v1m4 3v10a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7.13a1 1 0 0 1 .24-.65L7.7 8.35A1 1 0 0 1 8.46 8H13a1 1 0 0 1 1 1Z"/>
                        </svg>
                        <span>Copiar</span>
                    </span>
                `;
                copyFigureButton.classList.add('bg-blue-500', 'text-white', 'flex', 'items-center', 'p-2', 'rounded', 'hover:bg-blue-600', 'active:bg-blue-700', 'transition', 'duration-200');
                copyFigureButton.addEventListener('click', () => {
                    copyToClipboard(item.content);

                    // Cambiar el texto a "Copiado" temporalmente
                    const originalText = copyFigureButton.innerHTML;
                    copyFigureButton.innerHTML = `
                        <span class="flex items-center space-x-2">
                            <svg class="w-6 h-6 text-white dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                                <path stroke="currentColor" stroke-linejoin="round" stroke-width="2" d="M16.707 4.293a1 1 0 01.083 1.32l-.083.094-8 8a1 1 0 01-1.32.083l-.094-.083-4-4a1 1 0 011.32-1.497l.094.083L8 11.585l7.293-7.292a1 1 0 011.414 0z" clip-rule="evenodd" />
                            </svg>
                            <span>Copiado</span>
                        </span>
                    `;
                    copyFigureButton.classList.replace('bg-blue-500', 'bg-green-500'); // Cambiar el color de fondo temporalmente

                    // Revertir después de 1.5 segundos
                    setTimeout(() => {
                        copyFigureButton.innerHTML = originalText;
                        copyFigureButton.classList.replace('bg-green-500', 'bg-blue-500'); // Restaurar el color de fondo
                    }, 1500);
                });

            
                figureHeader.appendChild(figureOrder);
                figureHeader.appendChild(copyFigureButton);
            
                const figureContent = document.createElement('p');
                figureContent.classList.add('text-gray-800', 'dark:text-gray-300');
                figureContent.innerHTML = item.content;
            
                figureCard.appendChild(figureHeader);
                figureCard.appendChild(figureContent);
            
                // Mostrar nota de la figura si existe
                if (item.note) {
                    const noteDiv = document.createElement('div');
                    noteDiv.classList.add('mt-4', 'p-4', 'rounded-lg', 'bg-gray-50', 'dark:bg-gray-700');
            
                    const noteHeader = document.createElement('div');
                    noteHeader.classList.add('flex', 'justify-between', 'items-center', 'mb-2');
            
                    const noteOrder = document.createElement('span');
                    noteOrder.classList.add('text-gray-500', 'dark:text-gray-400', 'italic');
                    noteOrder.textContent = `Nota ${order}.`;
            
                    const copyNoteButton = document.createElement('button');
                    copyNoteButton.textContent = 'Copiar Nota';
                    copyNoteButton.classList.add('bg-blue-500', 'text-white', 'p-2', 'rounded', 'hover:bg-blue-600');
                    copyNoteButton.addEventListener('click', () => copyToClipboard(item.note));
            
                    noteHeader.appendChild(noteOrder);
                    noteHeader.appendChild(copyNoteButton);
            
                    const noteContent = document.createElement('p');
                    noteContent.classList.add('text-gray-800', 'dark:text-gray-300');
                    noteContent.innerHTML = item.note;
            
                    noteDiv.appendChild(noteHeader);
                    noteDiv.appendChild(noteContent);
                    figureCard.appendChild(noteDiv);
                }
            
                figuresDiv.appendChild(figureCard);
                order++;
            }
            
        });

        // Mostrar referencias completas sin orden, con botón de copiar
        parsedContent.references.forEach(ref => {
            const referenceCard = document.createElement('div');
            referenceCard.classList.add('reference-card', 'p-4', 'mb-4', 'rounded-lg', 'shadow', 'border', 'border-gray-300', 'dark:border-gray-700', 'transition', 'hover:shadow-lg', 'hover:bg-gray-100', 'dark:hover:bg-gray-800');
        
            const referenceHeader = document.createElement('div');
            referenceHeader.classList.add('flex', 'justify-between', 'items-center', 'mb-2');
        
            const referenceLabel = document.createElement('span');
            referenceLabel.classList.add('text-gray-500', 'dark:text-gray-400', 'font-semibold');
            referenceLabel.textContent = `Referencia:`;
        
            const copyButton = document.createElement('button');
            copyButton.innerHTML = `
                <span class="flex items-center space-x-2">
                    <svg class="w-6 h-6 text-white dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                        <path stroke="currentColor" stroke-linejoin="round" stroke-width="2" d="M9 8v3a1 1 0 0 1-1 1H5m11 4h2a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-7a1 1 0 0 0-1 1v1m4 3v10a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7.13a1 1 0 0 1 .24-.65L7.7 8.35A1 1 0 0 1 8.46 8H13a1 1 0 0 1 1 1Z"/>
                    </svg>
                    <span>Copiar</span>
                </span>
            `;
            copyButton.classList.add('bg-blue-500', 'text-white', 'flex', 'items-center', 'p-2', 'rounded', 'hover:bg-blue-600', 'active:bg-blue-700', 'transition', 'duration-200');
            copyButton.addEventListener('click', () => {
                copyToClipboard(ref.content);

                // Cambiar el texto a "Copiado" temporalmente
                const originalText = copyButton.innerHTML;
                copyButton.innerHTML = `
                    <span class="flex items-center space-x-2">
                        <svg class="w-6 h-6 text-white dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" stroke-linejoin="round" stroke-width="2" d="M16.707 4.293a1 1 0 01.083 1.32l-.083.094-8 8a1 1 0 01-1.32.083l-.094-.083-4-4a1 1 0 011.32-1.497l.094.083L8 11.585l7.293-7.292a1 1 0 011.414 0z" clip-rule="evenodd" />
                        </svg>
                        <span>Copiado</span>
                    </span>
                `;
                copyButton.classList.replace('bg-blue-500', 'bg-green-500'); // Cambiar el color de fondo temporalmente

                // Revertir después de 1.5 segundos
                setTimeout(() => {
                    copyButton.innerHTML = originalText;
                    copyButton.classList.replace('bg-green-500', 'bg-blue-500'); // Restaurar el color de fondo
                }, 1500);
            });

        
            referenceHeader.appendChild(referenceLabel);
            referenceHeader.appendChild(copyButton);
        
            const referenceContent = document.createElement('p');
            referenceContent.classList.add('text-gray-800', 'dark:text-gray-300');
            referenceContent.textContent = ref.content;
        
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
