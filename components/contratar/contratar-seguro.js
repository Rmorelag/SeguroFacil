export class ContratarSeguro extends HTMLElement {
  connectedCallback() {
    const {
      nombre,
      telefono,
      fechaNacimiento,
      codigoPostal,
      fechaCarnet,
      marca,
      modelo,
      anio,
      matricula,
      producto,
      precio,
      idPresupuesto
    } = this.dataset;

    this.innerHTML = `
      <h3>Formulario de contratación</h3>
      <form id="formContratar">
        <fieldset>
          <legend>Datos del cliente</legend>
          <label>Nombre:</label>
          <input type="text" name="nombre" value="${nombre}" readonly>
          <label>Apellidos:</label>
          <input type="text" name="apellidos" required>
          <label>Teléfono:</label>
          <input type="tel" name="telefono" value="${telefono}" readonly>
          <label>Correo electrónico:</label>
          <input type="email" name="email" required>
          <label>Dirección completa:</label>
          <input type="text" name="direccion" required>
          <label>Código Postal:</label>
          <input type="text" name="codigoPostal" value="${codigoPostal}" readonly>
          <label>Fecha de Nacimiento:</label>
          <input type="date" name="fechaNacimiento" value="${fechaNacimiento}" readonly>
        </fieldset>

        <fieldset>
          <legend>Datos del vehículo</legend>
          <label>Marca:</label>
          <input type="text" name="marca" value="${marca}" readonly>
          <label>Modelo:</label>
          <input type="text" name="modelo" value="${modelo}" readonly>
          <label>Año de matriculación:</label>
          <input type="text" name="anio" value="${anio}" readonly>
          <label>Matrícula:</label>
          <input type="text" name="matricula" value="${matricula}" readonly>
        </fieldset>

        <fieldset>
          <legend>Detalles del seguro</legend>
          <label>Producto seleccionado:</label>
          <input type="text" name="producto" value="${producto}" readonly>
          <label>Precio final:</label>
          <input type="text" name="precio" value="${precio}" readonly>
          <label>Número de cuenta (IBAN):</label>
          <input type="text" name="iban" pattern="[A-Z]{2}[0-9]{22}" required>
        </fieldset>

        <input type="hidden" name="id_presupuesto" value="${idPresupuesto}">
      </form>

      <div class="paypal-wrapper text-center mt-3">
        <div id="paypal-button-container"></div>
      </div>
      <div id="mensajeFinal" style="margin-top:20px; color: red;"></div>
      <a href="index.html">Volver al inicio</a>
    `;

    //Habilitamos pago por PayPal
    if (!window.paypal) {
      const script = document.createElement('script');
      script.src = 'https://www.paypal.com/sdk/js?client-id=AbwVPavBh_84Fsaws1vsjB1n1rsjJKhKF-nwyDHMDcu4RLtVWnx87KfobGYIGeIvmxFl6yaG4Nsp0mQt&currency=EUR&disable-funding=card,credit';
      script.onload = () => this.renderPayPalButton();
      script.onerror = () => {
        this.querySelector('#mensajeFinal').textContent = 'Error cargando SDK de PayPal.';
      };
      document.head.appendChild(script);
    } else {
      this.renderPayPalButton();
    }
  }

  renderPayPalButton() {
    const form = this.querySelector("#formContratar");
    const mensajeFinal = this.querySelector("#mensajeFinal");

    mensajeFinal.textContent = '';

    const paypalContainer = this.querySelector('#paypal-button-container');
    if (!paypalContainer) {
      mensajeFinal.textContent = 'Contenedor PayPal no encontrado.';
      return;
    }

    paypal.Buttons({

      createOrder: (data, actions) => {
        //Limpiamos mensajes previos si se han corregido los errores
        mensajeFinal.textContent = '';
        form.querySelectorAll('input').forEach(input => input.classList.remove('error'));

        const errores = [];

        const apellidos = form.apellidos.value.trim();
        const email = form.email.value.trim();
        const direccion = form.direccion.value.trim();
        const iban = form.iban.value.trim();

        //Validaciones
        if (!apellidos) {
          errores.push('Los apellidos son obligatorios.');
          form.apellidos.classList.add('error');
        }

        const emailRegex = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
        if (!emailRegex.test(email)) {
          errores.push('El correo electrónico no es válido.');
          form.email.classList.add('error');
        }

        if (!direccion) {
          errores.push('La dirección completa es obligatoria.');
          form.direccion.classList.add('error');
        }

        const ibanRegex = /^[A-Z]{2}[0-9]{22}$/;
        if (!ibanRegex.test(iban)) {
          errores.push('El IBAN no tiene un formato válido.');
          form.iban.classList.add('error');
        }

        //Si hay errores, no continuamos
        if (errores.length > 0) {
          //Concatenamos el mensaje general con los errores concretos, separados por saltos de línea
          const mensajeCompleto = 'Errores de validación:\n' + errores.join('\n');

          //Mostramos en pantalla los errores
          mensajeFinal.innerHTML = `<strong>Errores de validación:</strong><br>${errores.map(err => `<div>${err}</div>`).join('')}`;

          
          return Promise.reject(new Error(mensajeCompleto));
        }

        //Si no hay errores, se puede continuar con la creación de la póliza
        const precio = parseFloat(form.precio.value);
        return actions.order.create({
          purchase_units: [{
            amount: {
              value: precio.toFixed(2)
            }
          }]
        });
      },

      onApprove: async (data, actions) => {
        try {
          const details = await actions.order.capture();

          const formData = new FormData(form);
          formData.append('paypal_order_id', data.orderID);
          formData.append('paypal_payer_id', data.payerID);

          const response = await fetch('/codigo_ws.2/contratarSeguro.php', {
            method: 'POST',
            body: formData
          });

          const json = await response.json();

          //Si el pago devuelve estado OK, se actualiza el main con mensaje de bienvenida y enlace de descarga de PDF
          if (json.status === 'OK') {
            const nombre = form.nombre.value;
            const idPresupuestoFinal = json.id_presupuesto || form.querySelector('[name="id_presupuesto"]').value;

            this.innerHTML = `
              <h3>${nombre}, bienvenido a Seguro Fácil</h3>
              <p>En breve podrás descargar tu póliza en PDF.</p>
              <a href="/codigo_ws.2/generarPoliza.php?id_presupuesto=${idPresupuestoFinal}" target="_blank" rel="noopener">Descargar póliza en PDF</a>
            `;
          } else {
            mensajeFinal.textContent = `Error al guardar la póliza: ${json.message}`;
          }
        } catch (err) {
          mensajeFinal.textContent = `Error en la transacción: ${err.message}`;
        }
      },

      onError: err => {
        mensajeFinal.textContent = `Error en PayPal: ${err}`;
      }
    }).render(paypalContainer);
  }
}

customElements.define("contratar-seguro", ContratarSeguro);
