import { obtenerMarcas, obtenerModelos, obtenerRecargoPorMarca, obtenerProductos, obtenerRecargoPorCodigoPostal } from "./datos.js";
import "../contratar/contratar-seguro.js";

export class CrearPresupuesto extends HTMLElement {
    constructor() {
        super();

        this.innerHTML = `
            <h3>Crear Presupuesto</h3>
            <form id="formPresupuesto" method="post">
                <label>Nombre:</label>
                <input type="text" id="nombre" required>

                <label>Teléfono:</label>
                <input type="tel" id="telefono" required>

                <label>Fecha de Nacimiento:</label>
                <input type="date" id="fechaNacimiento" required>

                <label>Código Postal:</label>
                <input type="number" id="codigoPostal" required>

                <label>Fecha de Expedición del Carnet:</label>
                <input type="date" id="fechaCarnet" required>

                <label>Años con Seguro:</label>
                <input type="number" id="aniosSeguro" min="0" required>

                <label>Número de Partes:</label>
                <input type="number" id="numPartes" min="0" required>

                <label>Marca:</label>
                <select id="marca" required>
                    <option value="">Seleccione una marca</option>
                </select>

                <label>Modelo:</label>
                <select id="modelo" required disabled>
                    <option value="">Seleccione un modelo</option>
                </select>

                <label>Año de Matriculación:</label>
                <input type="text" id="anio" required>    

                <label>Matrícula:</label>
                <input type="text" id="matricula" required>

                <button type="submit" disabled>Calcular</button>
            </form>
            <p id="resultado"></p>
            <a href="index.html">Volver al inicio</a>
        `;
    }

    async connectedCallback() {
        const marcaSelect = this.querySelector("#marca");
        const modeloSelect = this.querySelector("#modelo");
        const botonCalcular = this.querySelector("button");
        const form = this.querySelector("#formPresupuesto");

        //Cargamos marcas
        const marcas = await obtenerMarcas();
        marcas.forEach(marca => {
            marcaSelect.innerHTML += `<option value="${marca}">${marca}</option>`;
        });

        //Modelos según marca
        marcaSelect.addEventListener("change", async () => {
            modeloSelect.innerHTML = '<option value="">Seleccione un modelo</option>';
            modeloSelect.disabled = true;
            botonCalcular.disabled = true;

            if (marcaSelect.value) {
                const modelos = await obtenerModelos(marcaSelect.value);
                modelos.forEach(modelo => {
                    modeloSelect.innerHTML += `<option value="${modelo}">${modelo}</option>`;
                });
                modeloSelect.disabled = false;
            }
        });

        modeloSelect.addEventListener("change", () => {
            botonCalcular.disabled = !modeloSelect.value;
        });

        form.addEventListener("submit", (e) => {
            e.preventDefault();
            this.calcularSeguro();
        });
    }

    async calcularSeguro() {
        const nombre = this.querySelector("#nombre").value.trim();
        const telefono = this.querySelector("#telefono").value.trim();
        const fechaNacimiento = this.querySelector("#fechaNacimiento").value;
        const codigoPostal = this.querySelector("#codigoPostal").value.trim();
        const fechaCarnet = this.querySelector("#fechaCarnet").value;
        const aniosSeguroStr = this.querySelector("#aniosSeguro").value.trim();
        const numPartesStr = this.querySelector("#numPartes").value.trim();
        const marca = this.querySelector("#marca").value;
        const modelo = this.querySelector("#modelo").value;
        const anio = this.querySelector("#anio").value.trim();
        const matricula = this.querySelector("#matricula").value.trim();

        //Validaciones
        if (nombre.length < 3) {
            alert("El nombre debe tener al menos 3 letras.");
            return;
        }

        if (!/^\d{9,15}$/.test(telefono)) {
            alert("El teléfono debe contener entre 9 y 15 dígitos numéricos.");
            return;
        }

        if (!fechaNacimiento) {
            alert("Debe introducir la fecha de nacimiento.");
            return;
        }
        const fechaNacimientoDate = new Date(fechaNacimiento);
        const hoy = new Date();
        let edad = hoy.getFullYear() - fechaNacimientoDate.getFullYear();
        const cumpleEsteAno = new Date(hoy.getFullYear(), fechaNacimientoDate.getMonth(), fechaNacimientoDate.getDate());
        if (cumpleEsteAno > hoy) edad--;

        if (edad < 18) {
            alert("Debe ser mayor de 18 años.");
            return;
        }

        if (!fechaCarnet) {
            alert("Debe introducir la fecha de expedición del carnet.");
            return;
        }
        const fechaCarnetDate = new Date(fechaCarnet);

        const diffCarnetNacimiento = (fechaCarnetDate - fechaNacimientoDate) / (1000 * 60 * 60 * 24 * 365.25);
        if (diffCarnetNacimiento < 18) {
            alert("La fecha de expedición del carnet debe ser al menos 18 años después de la fecha de nacimiento.");
            return;
        }

        const aniosSeguro = parseInt(aniosSeguroStr);
        if (isNaN(aniosSeguro) || aniosSeguro < 0) {
            alert("Introduzca un número válido para años con seguro.");
            return;
        }
        const numPartes = parseInt(numPartesStr);
        if (isNaN(numPartes) || numPartes < 0) {
            alert("Introduzca un número válido para número de partes.");
            return;
        }

        if (!marca) {
            alert("Debe seleccionar una marca.");
            return;
        }
        if (!modelo) {
            alert("Debe seleccionar un modelo.");
            return;
        }

        const anioNum = parseInt(anio);
        if (isNaN(anioNum) || anioNum < 1900 || anioNum > hoy.getFullYear()) {
            alert("Introduzca un año de matriculación válido.");
            return;
        }

        if (matricula.length < 5) {
            alert("Introduzca una matrícula válida.");
            return;
        }

        if (!codigoPostal || !/^\d+$/.test(codigoPostal)) {
            alert("Introduzca un código postal válido.");
            return;
        }

        const productos = await obtenerProductos();

        let precioRiesgo = 0;
        let resultadoHTML = `<h4>Opciones de seguro para ${nombre} y el vehículo ${marca} ${modelo}:</h4>`;

        if ((edad < 24) || (edad > 65)) precioRiesgo += 50;

        const carnet = hoy.getFullYear() - fechaCarnetDate.getFullYear();
        if (carnet < 5) precioRiesgo += 100;

        const antiguedadCoche = hoy.getFullYear() - anioNum;
        if (antiguedadCoche > 7) precioRiesgo += 100;

        switch (aniosSeguro) {
            case 0: precioRiesgo += 300; break;
            case 1: precioRiesgo += 200; break;
            case 2: precioRiesgo += 150; break;
            case 3: precioRiesgo += 100; break;
            case 4: precioRiesgo -= 50; break;
            default: precioRiesgo -= 75; break;
        }

        switch (numPartes) {
            case 0: break;
            case 1: precioRiesgo += 50; break;
            case 2: precioRiesgo += 150; break;
            default:
                alert('No asegurable');
                return;
        }

        const recargoMarca = await obtenerRecargoPorMarca(marca);
        const recargoCodigoPostal = await obtenerRecargoPorCodigoPostal(codigoPostal);

        this.querySelector("#resultado").innerHTML = resultadoHTML;

        productos.forEach(producto => {
            let recargoM = parseInt(producto.precio) + (parseInt(producto.precio) * recargoMarca / 100);
            let recargoCp = parseInt(producto.precio) + (parseInt(producto.precio) * (recargoCodigoPostal / 100));
            let precioFinal = precioRiesgo + recargoCp + recargoM;

            const botonId = `contratar-${producto.nombre.toLowerCase().replace(/\s+/g, "-")}`;

            resultadoHTML += `
                <div style="margin-bottom: 1rem;">
                    <p><strong>${producto.nombre}</strong>: ${precioFinal.toFixed(2)} €</p>
                    <p>${producto.descripcion || ''}</p>
                    <button id="${botonId}">Contratar/Guardar</button>
                </div>
            `;
        });

        this.querySelector("#resultado").innerHTML = resultadoHTML;

        productos.forEach(producto => {
            const botonId = `contratar-${producto.nombre.toLowerCase().replace(/\s+/g, "-")}`;
            const boton = this.querySelector(`#${botonId}`);

            boton.addEventListener("click", async () => {
                let recargoM = parseInt(producto.precio) + (parseInt(producto.precio) * recargoMarca / 100);
                let recargoCp = parseInt(producto.precio) + (parseInt(producto.precio) * (recargoCodigoPostal / 100));
                let precioFinal = precioRiesgo + recargoCp + recargoM;

                try {
                    const res = await fetch("guardarPresup.php", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            nombre,
                            telefono,
                            fechaNacimiento,
                            codigoPostal,
                            fechaCarnet,
                            aniosSeguro,
                            numPartes,
                            marca,
                            modelo,
                            anio,
                            matricula,
                            producto: producto.nombre,
                            precio: precioFinal,
                        })
                    });

                    const data = await res.json();

                    if (data.error) {
                        alert("Error del servidor:\n" + data.error);
                        return;
                    }

                    //Si todo funciona bien, mostramos pantalla contratar y transferimos información en dataset
                    const contratar = document.createElement("contratar-seguro");
                    contratar.dataset.nombre = nombre;
                    contratar.dataset.telefono = telefono;
                    contratar.dataset.fechaNacimiento = fechaNacimiento;
                    contratar.dataset.codigoPostal = codigoPostal;
                    contratar.dataset.fechaCarnet = fechaCarnet;
                    contratar.dataset.marca = marca;
                    contratar.dataset.modelo = modelo;
                    contratar.dataset.anio = anio;
                    contratar.dataset.matricula = matricula;
                    contratar.dataset.precio = precioFinal;
                    contratar.dataset.producto = producto.nombre;

                    this.replaceWith(contratar);

                } catch (err) {
                    console.error("Error de red:", err);
                    alert("Error de conexión con el servidor.");
                }
            });
        });
    }
}

customElements.define("crear-presupuesto", CrearPresupuesto);
