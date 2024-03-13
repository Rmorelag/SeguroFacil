export async function obtenerMarcas() {
    const response = await fetch("/codigo_ws.2/datosAuto.php?accion=marcas");
    return await response.json();
}

export async function obtenerModelos(marca) {
    const response = await fetch(`/codigo_ws.2/datosAuto.php?accion=modelos&marca=${encodeURIComponent(marca)}`);
    return await response.json();
}

export async function obtenerRecargoPorMarca(marca) {
    try {
        //Buscamos el recargo correspondiente a la marca
        const response = await fetch(`/codigo_ws.2/datosAuto.php?accion=recargoMarca&marca=${encodeURIComponent(marca)}`);
        if (!response.ok) {
            throw new Error('Error al obtener el recargo de la marca');
        }
        const data = await response.json();
        return data.recargo;
    } catch (error) {
        console.error('Error al obtener el recargo:', error);
        return 0; //Si hay error, devolvemos un recargo de 0
    }
}

export async function obtenerProductos() {
    try {
        const response = await fetch('/codigo_ws.2/productos.php');
        if (!response.ok) {
            throw new Error('Error al obtener los productos');
        }
        const productos = await response.json();
        return productos;
    } catch (error) {
        console.error('Error al obtener los productos:', error);
        return [];
    }
}

export async function obtenerRecargoPorCodigoPostal(codigoPostal) {
    try {
        const response = await fetch(`/codigo_ws.2/recargo.php?codigoPostal=${encodeURIComponent(codigoPostal)}`);
        if (!response.ok) {
            throw new Error('Error al obtener el recargo por código postal');
        }
        const data = await response.json();
        return data.recargo;
    } catch (error) {
        console.error('Error al obtener el recargo:', error);
        return 0; //Si hay un error, devolvemos un recargo de 0
    }
}

