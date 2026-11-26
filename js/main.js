// =====================================================
// Simulador de Ahorro Personal
// Pre-Entrega 7: Interfaz dinámica con DOM y eventos
// (continúa lo hecho en las pre-entregas 2 a 6)
//
// Ya no usamos prompt, alert ni console.log:
// toda la interacción pasa por el DOM y los eventos.
// =====================================================


// =====================================================
// CLASE: MetaDeAhorro
// Cada meta sabe cuánto necesita, cuánto lleva ahorrado
// y puede calcular su propio progreso.
// =====================================================
class MetaDeAhorro {
    constructor(id, nombre, montoObjetivo, montoAhorrado) {
        this.id = id;
        this.nombre = nombre;
        this.montoObjetivo = montoObjetivo;
        this.montoAhorrado = montoAhorrado;
    }

    // Suma dinero a la meta (modifica el estado del objeto)
    aportar(monto) {
        this.montoAhorrado = this.montoAhorrado + monto;
        return this.montoAhorrado;
    }

    // Cuánto falta para cumplir la meta (nunca menos de 0)
    calcularFaltante() {
        const faltante = this.montoObjetivo - this.montoAhorrado;
        return faltante > 0 ? faltante : 0;
    }

    // Porcentaje de avance (máximo 100%)
    calcularPorcentaje() {
        const porcentaje = Math.round((this.montoAhorrado * 100) / this.montoObjetivo);
        return porcentaje > 100 ? 100 : porcentaje;
    }

    // ¿Ya se cumplió? (true / false)
    estaCumplida() {
        return this.montoAhorrado >= this.montoObjetivo;
    }

    // Meses que faltan según el ahorro mensual del usuario
    calcularMesesRestantes(ahorroMensual) {
        return Math.ceil(this.calcularFaltante() / ahorroMensual);
    }
}


// =====================================================
// DATOS INICIALES: array de objetos creados con "new"
// =====================================================
const metasDeAhorro = [
    new MetaDeAhorro(1, "Fondo de emergencia", 300000, 120000),
    new MetaDeAhorro(2, "Curso de inglés", 90000, 45000),
    new MetaDeAhorro(3, "Notebook", 800000, 0),
    new MetaDeAhorro(4, "Vacaciones", 500000, 50000),
    new MetaDeAhorro(5, "Bicicleta", 250000, 250000)
];

let proximoId = metasDeAhorro.length + 1;
let ahorroMensual = 15000;
let temporizadorMensaje; // para ocultar el mensaje de feedback después de unos segundos


// =====================================================
// SELECCIÓN DE ELEMENTOS DEL DOM
// =====================================================
const mensaje = document.getElementById("mensaje");

const inputAhorro = document.getElementById("input-ahorro");
const btnAhorro = document.getElementById("btn-ahorro");
const textoAhorro = document.getElementById("texto-ahorro");

const contenedorResumen = document.querySelector("#resumen");

const inputNombre = document.getElementById("input-nombre");
const inputObjetivo = document.getElementById("input-objetivo");
const inputInicial = document.getElementById("input-inicial");
const inputPrioritaria = document.getElementById("input-prioritaria");
const btnAgregar = document.getElementById("btn-agregar");

const inputBuscar = document.querySelector("#input-buscar");
const selectFiltro = document.querySelector("#select-filtro");
const selectOrden = document.querySelector("#select-orden");
const contenedorMetas = document.getElementById("contenedor-metas");


// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

// Da formato de pesos argentinos: 45000 -> $45.000
const formatearPesos = (monto) => "$" + monto.toLocaleString("es-AR");

// Deja la primera letra en mayúscula: "  auto " -> "Auto"
const normalizarTexto = (texto) => texto.trim().charAt(0).toUpperCase() + texto.trim().slice(1).toLowerCase();

// Escribe "1 mes" o "5 meses" según corresponda
const textoMeses = (cantidad) => cantidad === 1 ? "1 mes" : cantidad + " meses";

// Evita que un texto escrito por el usuario se interprete como HTML
const escaparHTML = (texto) => texto.replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Muestra un mensaje en pantalla (tipo: "exito" o "error") y lo oculta a los 3 segundos
function mostrarMensaje(texto, tipo) {
    mensaje.textContent = texto;
    mensaje.className = "mensaje " + tipo;

    clearTimeout(temporizadorMensaje);
    temporizadorMensaje = setTimeout(() => {
        mensaje.className = "mensaje oculto";
    }, 3000);
}

// Resalta por un momento la tarjeta de una meta (después de agregarla o aportarle)
function resaltarMeta(id) {
    const tarjeta = document.querySelector(`.tarjeta[data-id="${id}"]`);
    if (tarjeta) {
        tarjeta.classList.add("resaltada");
    }
}


// =====================================================
// RENDERIZADO: dibuja en pantalla según el array
// =====================================================

// Muestra el ahorro mensual actual y la proyección anual
function renderizarAhorro() {
    textoAhorro.innerHTML = `Ahorrás <strong>${formatearPesos(ahorroMensual)}</strong> por mes:
        en un año juntás <strong>${formatearPesos(ahorroMensual * 12)}</strong>.`;
}

// Calcula los totales con reduce y los muestra en tarjetas
function renderizarResumen() {
    const totalNecesario = metasDeAhorro.reduce((acc, meta) => acc + meta.montoObjetivo, 0);
    const totalAhorrado = metasDeAhorro.reduce((acc, meta) => acc + meta.montoAhorrado, 0);
    const totalFaltante = metasDeAhorro.reduce((acc, meta) => acc + meta.calcularFaltante(), 0);
    const cumplidas = metasDeAhorro.filter((meta) => meta.estaCumplida()).length;
    const avance = totalNecesario > 0 ? Math.round((totalAhorrado * 100) / totalNecesario) : 0;

    contenedorResumen.innerHTML = `
        <div class="dato"><span>Necesitás</span><strong>${formatearPesos(totalNecesario)}</strong></div>
        <div class="dato"><span>Ahorraste</span><strong>${formatearPesos(totalAhorrado)}</strong></div>
        <div class="dato"><span>Te falta</span><strong>${formatearPesos(totalFaltante)}</strong></div>
        <div class="dato"><span>Avance general</span><strong>${avance}%</strong><span>${cumplidas} de ${metasDeAhorro.length} metas cumplidas</span></div>
    `;
}

// Devuelve las metas que se tienen que ver según la búsqueda, el filtro y el orden elegidos
function obtenerMetasVisibles() {
    const textoBuscado = inputBuscar.value.trim().toLowerCase();
    const filtro = selectFiltro.value;
    const orden = selectOrden.value;

    // filter: búsqueda por nombre
    let resultado = metasDeAhorro.filter((meta) => meta.nombre.toLowerCase().includes(textoBuscado));

    // filter: pendientes o cumplidas
    if (filtro === "pendientes") {
        resultado = resultado.filter((meta) => !meta.estaCumplida());
    } else if (filtro === "cumplidas") {
        resultado = resultado.filter((meta) => meta.estaCumplida());
    }

    // sort: sobre una copia para no perder el orden de prioridad original
    resultado = [...resultado];
    if (orden === "mayor-monto") {
        resultado.sort((a, b) => b.montoObjetivo - a.montoObjetivo);
    } else if (orden === "menor-monto") {
        resultado.sort((a, b) => a.montoObjetivo - b.montoObjetivo);
    } else if (orden === "avance") {
        resultado.sort((a, b) => b.calcularPorcentaje() - a.calcularPorcentaje());
    }

    return resultado;
}

// Recorre el array y genera una tarjeta HTML por cada meta (innerHTML + backticks)
function renderizarMetas() {
    const metasVisibles = obtenerMetasVisibles();

    // Limpiamos el contenedor antes de volver a dibujar
    contenedorMetas.innerHTML = "";

    if (metasVisibles.length === 0) {
        contenedorMetas.innerHTML = `<p class="vacio">No hay metas para mostrar.</p>`;
        return;
    }

    metasVisibles.forEach((meta) => {
        const porcentaje = meta.calcularPorcentaje();
        const cumplida = meta.estaCumplida();
        const esPrimera = metasDeAhorro[0] === meta;

        const detalle = cumplida
            ? "🎉 ¡Meta cumplida!"
            : `Te faltan ${formatearPesos(meta.calcularFaltante())} → ${textoMeses(meta.calcularMesesRestantes(ahorroMensual))}`;

        const zonaAporte = cumplida
            ? ""
            : `<input type="number" class="input-aporte" placeholder="Monto a aportar" min="1">
               <button type="button" class="btn btn-principal btn-aportar" data-id="${meta.id}">Aportar</button>`;

        contenedorMetas.innerHTML += `
            <article class="tarjeta ${cumplida ? "cumplida" : ""}" data-id="${meta.id}">
                <h3>${escaparHTML(meta.nombre)} ${esPrimera ? '<span class="etiqueta">Prioridad</span>' : ""}</h3>
                <p>${formatearPesos(meta.montoAhorrado)} de ${formatearPesos(meta.montoObjetivo)} (${porcentaje}%)</p>
                <div class="barra"><div class="barra-progreso" style="width: ${porcentaje}%"></div></div>
                <p class="texto-suave">${detalle}</p>
                <div class="acciones">
                    ${zonaAporte}
                    <button type="button" class="btn btn-eliminar" data-id="${meta.id}">Eliminar</button>
                </div>
            </article>
        `;
    });
}

// Vuelve a dibujar todo: se llama cada vez que el array cambia
function actualizarVista() {
    renderizarAhorro();
    renderizarResumen();
    renderizarMetas();
}


// =====================================================
// ACCIONES DEL USUARIO
// =====================================================

// Guarda un nuevo ahorro mensual
function guardarAhorro() {
    const nuevoAhorro = parseFloat(inputAhorro.value);

    if (isNaN(nuevoAhorro) || nuevoAhorro <= 0) {
        mostrarMensaje("Ingresá un ahorro mensual mayor a 0.", "error");
        return;
    }

    ahorroMensual = nuevoAhorro;
    inputAhorro.value = "";
    actualizarVista();
    mostrarMensaje(`Listo: ahora ahorrás ${formatearPesos(ahorroMensual)} por mes.`, "exito");
}

// Crea una meta nueva con los datos del formulario
function agregarMeta() {
    const nombre = normalizarTexto(inputNombre.value);
    const objetivo = parseFloat(inputObjetivo.value);
    const inicial = inputInicial.value === "" ? 0 : parseFloat(inputInicial.value);

    // Validaciones
    if (nombre === "") {
        mostrarMensaje("Escribí el nombre de la meta.", "error");
        return;
    }
    if (isNaN(objetivo) || objetivo <= 0) {
        mostrarMensaje("El monto que necesitás tiene que ser mayor a 0.", "error");
        return;
    }
    if (isNaN(inicial) || inicial < 0) {
        mostrarMensaje("Lo que ya tenés ahorrado no puede ser negativo.", "error");
        return;
    }
    // some: ¿ya existe una meta con ese nombre?
    if (metasDeAhorro.some((meta) => meta.nombre.toLowerCase() === nombre.toLowerCase())) {
        mostrarMensaje(`La meta "${nombre}" ya está en tu lista.`, "error");
        return;
    }

    const nuevaMeta = new MetaDeAhorro(proximoId, nombre, objetivo, inicial);
    proximoId++;

    if (inputPrioritaria.checked) {
        metasDeAhorro.unshift(nuevaMeta); // al principio: es la prioridad número 1
    } else {
        metasDeAhorro.push(nuevaMeta); // al final
    }

    // Limpiamos el formulario y los filtros para que se vea la meta nueva
    inputNombre.value = "";
    inputObjetivo.value = "";
    inputInicial.value = "";
    inputPrioritaria.checked = false;
    inputBuscar.value = "";
    selectFiltro.value = "todas";

    actualizarVista();
    resaltarMeta(nuevaMeta.id);
    mostrarMensaje(`Meta "${nombre}" agregada ✅`, "exito");
}

// Suma dinero a una meta usando su método aportar()
function aportarAMeta(id, inputAporte) {
    const monto = parseFloat(inputAporte.value);
    const meta = metasDeAhorro.find((m) => m.id === id); // find: trae el objeto por su id

    if (isNaN(monto) || monto <= 0) {
        mostrarMensaje("Ingresá un monto mayor a 0 para aportar.", "error");
        return;
    }

    meta.aportar(monto);
    actualizarVista();
    resaltarMeta(id);

    if (meta.estaCumplida()) {
        mostrarMensaje(`🎉 ¡Felicitaciones! Cumpliste la meta "${meta.nombre}".`, "exito");
    } else {
        mostrarMensaje(`Aportaste ${formatearPesos(monto)} a "${meta.nombre}". Llevás ${meta.calcularPorcentaje()}%.`, "exito");
    }
}

// Quita una meta del array usando su posición
function eliminarMeta(id) {
    const indice = metasDeAhorro.findIndex((meta) => meta.id === id); // findIndex: posición en el array
    const eliminada = metasDeAhorro.splice(indice, 1)[0];

    actualizarVista();
    mostrarMensaje(`Se eliminó la meta "${eliminada.nombre}".`, "error");
}


// =====================================================
// EVENTOS
// =====================================================

// CLICK en los botones del formulario y del ahorro mensual
btnAhorro.addEventListener("click", guardarAhorro);
btnAgregar.addEventListener("click", agregarMeta);

// TECLADO: Enter en el input de ahorro o en el formulario
inputAhorro.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter") {
        guardarAhorro();
    }
});

[inputNombre, inputObjetivo, inputInicial].forEach((input) => {
    input.addEventListener("keydown", (evento) => {
        if (evento.key === "Enter") {
            agregarMeta();
        }
    });
});

// TECLADO: la lista se filtra mientras el usuario escribe en el buscador
inputBuscar.addEventListener("keyup", renderizarMetas);

// CHANGE: al elegir otro filtro u orden, se vuelve a dibujar la lista
selectFiltro.addEventListener("change", renderizarMetas);
selectOrden.addEventListener("change", renderizarMetas);

// CLICK en los botones de cada tarjeta (Aportar / Eliminar).
// Como las tarjetas se crean dinámicamente, escuchamos el click en el contenedor
// y revisamos qué botón se tocó (delegación de eventos).
contenedorMetas.addEventListener("click", (evento) => {
    const boton = evento.target;
    const id = parseInt(boton.dataset.id);

    if (boton.classList.contains("btn-eliminar")) {
        eliminarMeta(id);
    } else if (boton.classList.contains("btn-aportar")) {
        const inputAporte = boton.parentElement.querySelector(".input-aporte");
        aportarAMeta(id, inputAporte);
    }
});

// Enter dentro del input de aporte de una tarjeta
contenedorMetas.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter" && evento.target.classList.contains("input-aporte")) {
        const boton = evento.target.parentElement.querySelector(".btn-aportar");
        aportarAMeta(parseInt(boton.dataset.id), evento.target);
    }
});


// =====================================================
// INICIO: primer dibujado de la página
// =====================================================
actualizarVista();
