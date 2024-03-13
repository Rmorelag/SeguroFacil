document.addEventListener("DOMContentLoaded", () => {
    const botonCrear = document.getElementById("btnCrear");
    const botonRecuperar = document.getElementById("btnRecuperar");
    const main = document.querySelector("main"); // Seleccionamos el <main>

    //Función para reemplazar completamente el contenido del <main>
    function mostrarFormulario(tipoFormulario) {
        if (tipoFormulario === "crear-presupuesto") {
            import(`/codigo_ws.2/components/crear_presupuesto/crear-presupuesto.js`).then(() => {
                main.innerHTML = `<crear-presupuesto></crear-presupuesto>`;
            });
        } else if (tipoFormulario === "recuperar-presupuesto") {
            import('/codigo_ws.2/components/recuperar_presupuesto/recuperar-presupuesto.js').then(() => {
                main.innerHTML = `<recuperar-presupuesto></recuperar-presupuesto>`;
            });
        }
    }

    // Eventos para los botones
    botonCrear.addEventListener("click", () => mostrarFormulario("crear-presupuesto"));
    botonRecuperar.addEventListener("click", () => mostrarFormulario("recuperar-presupuesto"));
});
