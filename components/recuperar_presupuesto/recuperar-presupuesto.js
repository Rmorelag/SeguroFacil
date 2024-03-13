import "../contratar/contratar-seguro.js";

class RecuperarPresupuesto extends HTMLElement {
  constructor() {
    super();

    this.innerHTML = `
      <form id="formRecuperar">
        <label for="matricula">Matrícula del vehículo:</label>
        <input type="text" id="matricula" name="matricula" maxlength="7" required pattern="[A-Za-z0-9]{1,7}" placeholder="Ej: 1234ABC" />

        <label for="telefono">Teléfono asociado:</label>
        <input type="tel" id="telefono" name="telefono" required placeholder="Ej: 600123456" />

        <button type="submit">Buscar presupuestos</button>
      </form>
      <div class="lista-presupuestos" id="listaPresupuestos"></div>
      <a href="index.html">Volver al inicio</a>
    `;
  }

  connectedCallback() {
    this.querySelector("#formRecuperar").addEventListener("submit", (e) => {
      e.preventDefault();
      this.buscarPresupuestos();
    });
  }

  formatearFechaISO(fecha) {
    if (!fecha) return "";
    const delimitador = fecha.includes("-") ? "-" : "/";
    let [parte1, parte2, parte3] = fecha.split(delimitador);
    if (parte1.length === 4) {
      return `${parte1}-${parte2.padStart(2, "0")}-${parte3.padStart(2, "0")}`;
    }
    return `${parte3}-${parte2.padStart(2, "0")}-${parte1.padStart(2, "0")}`;
  }

  async buscarPresupuestos() {
    const matricula = this.querySelector("#matricula").value.trim().toUpperCase();
    const telefono = this.querySelector("#telefono").value.trim();
    const listaDiv = this.querySelector("#listaPresupuestos");

    //Validaciones
    if (!matricula) {
      listaDiv.innerHTML = `<p style="color:red;">Por favor, introduce una matrícula.</p>`;
      return;
    }

    if (!/^[0-9]{9}$/.test(telefono)) {
      listaDiv.innerHTML = `<p style="color:red;">Por favor, introduce un teléfono válido de 9 dígitos.</p>`;
      return;
    }

    try {
      const res = await fetch("/codigo_ws.2/recuperarPresup.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matricula, telefono }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        listaDiv.innerHTML = `<p style="color:red;">Error: ${errorData.error || res.statusText}</p>`;
        return;
      }

      const presupuestos = await res.json();

      if (!Array.isArray(presupuestos) || presupuestos.length === 0) {
        listaDiv.innerHTML = "<p>No se encontraron presupuestos para esa matrícula y teléfono.</p>";
        return;
      }

      this.querySelector("#formRecuperar").style.display = "none";
      listaDiv.innerHTML = "";

      //Si hay coincidencia, se muestra la información recuperada de la tabla presupuesto
      presupuestos.forEach((p, idx) => {
        const div = document.createElement("div");
        div.classList.add("presupuesto");

        div.innerHTML = `
          <strong>Presupuesto #${idx + 1}</strong><br>
          Matrícula: ${p.matricula}<br>
          Marca: ${p.marca || "N/D"}<br>
          Modelo: ${p.modelo || "N/D"}<br>
          Año: ${p.coche_anio || "N/D"}<br>
          Precio: ${parseFloat(p.precio).toFixed(2)} €<br>
          ${p.cliente_nombre ? `Nombre: ${p.cliente_nombre}<br>` : ""}
          ${p.telefono ? `Teléfono: ${p.telefono}<br>` : ""}
          ${p.fecha_nacimiento ? `Fecha de nacimiento: ${p.fecha_nacimiento}<br>` : ""}
          ${p.fecha_carnet ? `Fecha de carnet: ${p.fecha_carnet}<br>` : ""}
          ${p.cp ? `Código postal: ${p.cp}<br>` : ""}
          ${p.anios_seguro ? `Años con seguro: ${p.anios_seguro}<br>` : ""}
          ${p.numero_partes !== null ? `Número de partes: ${p.numero_partes}<br>` : ""}
          ${p.producto_nombre ? `Producto: ${p.producto_nombre}<br>` : ""}
          ${p.producto_descripcion ? `Descripción: ${p.producto_descripcion}<br>` : ""}
          <button class="contratar">Contratar</button>
        `;

        listaDiv.appendChild(div);

        const botonContratar = div.querySelector("button.contratar");

        //Transferimos información a dataset para utilizar en contratar-seguro
        botonContratar.dataset.idPresupuesto = p.id || "";
        botonContratar.dataset.nombre = p.cliente_nombre || "";
        botonContratar.dataset.telefono = p.telefono || "";
        botonContratar.dataset.fechaNacimiento = this.formatearFechaISO(p.fecha_nacimiento);
        botonContratar.dataset.codigoPostal = p.cp || "";
        botonContratar.dataset.fechaCarnet = this.formatearFechaISO(p.fecha_carnet);
        botonContratar.dataset.marca = p.marca || "";
        botonContratar.dataset.modelo = p.modelo || "";
        botonContratar.dataset.anio = p.coche_anio || "";
        botonContratar.dataset.matricula = p.matricula || "";
        botonContratar.dataset.precio = parseFloat(p.precio).toFixed(2) || "";
        botonContratar.dataset.producto = p.producto_nombre || "";

        botonContratar.addEventListener("click", () => {
          const contratar = document.createElement("contratar-seguro");

          for (const key in botonContratar.dataset) {
            contratar.dataset[key] = botonContratar.dataset[key];
          }

          const main = document.querySelector("main");
          if (main) {
            main.innerHTML = "";
            main.appendChild(contratar);
          } else {
            console.error("No se encontró el elemento <main> para insertar contratar-seguro.");
          }
        });
      });
    } catch (err) {
      listaDiv.innerHTML = `<p style="color:red;">Error en la conexión o servidor.</p>`;
      console.error(err);
    }
  }
}

customElements.define("recuperar-presupuesto", RecuperarPresupuesto);
