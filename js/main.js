//Constantes
const API_URL = "https://movetrack.develotion.com/"
const API_IMAGENES = "https://movetrack.develotion.com/imgs/"

//DOM
const ROUTER = document.querySelector("#ruteo")
const NAV = document.querySelector("#nav")

const PANTALLA_HOME = document.querySelector("#pageHome")
const PANTALLA_LOGIN = document.querySelector("#pageLogin")
const PANTALLA_REGISTRO_USUARIO = document.querySelector("#pageRegistroUsuario")
const PANTALLA_PRINCIPAL = document.querySelector("#pageApp")
const MENU_TAB = document.querySelector('#tabMain')

// Inicializaci n del sistema
inicializar()

function inicializar() {
  subscripcionAEventos()
  verificarUsuarioLocalStorage()
}

function subscripcionAEventos() {
  // Routeo
  ROUTER.addEventListener("ionRouteDidChange", navegar)
  MENU_TAB.addEventListener("ionTabsWillChange", navegarTab)
  document.querySelector("#rFiltroRegistros").addEventListener("ionChange", filtrarRegistros)
}

function verificarUsuarioLocalStorage() {
  const usuarioRecuperado = localStorage.getItem("OBDesAPKUsuarioActivo")
  if (usuarioRecuperado)
    sistema.usuarioActivo = JSON.parse(usuarioRecuperado)
}


//Navegacion
function navegar(e) {
  const ruta = e.detail.to
  switch (ruta) {
    case "/":
      //TODO Crear pantalla de carga
      cargarPaises()
        .then(() => {
          verificarInicio()
        })
      break
    case "/login":
      mostrarLogin()
      break
    case "/registroUsuario":
      mostrarRegistroUsuario()
      break
    case "/app":
      //TODO Crear pantalla de carga
      cargarActividades()
        .then(() => {
          mostrarPrincipal()
        })
      break
    default:
      verificarInicio()
      break;
  }
}

function verificarInicio() {
  if (sistema.usuarioActivo) {
    NAV.setRoot("page-app")
  } else {
    NAV.setRoot("page-login")
  }
}

function navegarTab(e) {
  const tab = e.detail.tab

  switch (tab) {
    case "tabResumen":

      break;
    case "tabNuevoRegistro":
      limpiarTabNuevoRegistro()
      break;
    case "tabListaRegistros":
      cargarListaRegistros()
      break;
    case "tabMapaUsuarios":

      break;
  }
}

function cargarPaises() {
  if (sistema.paises) return Promise.resolve()

  return fetch(`${API_URL}paises.php`)
    .then((response) => {
      if (response.status != 200)
        //TODO en caso de que se use la carga de paises en otro lado, modificar como se muestra el error, tal vez hacerlo en un alert global
        document.querySelector("#pRegistroUsuarioPais").innerHTML = "Error en el servidor, no se pueden cargar los paises"
      return response.json()
    }).then((data) => {
      sistema.paises = data.paises.map(p => Pais.parse(p))
      cargarPaisesEnSelect()
    }).catch((error) => {
      console.log(error)
    })
}

function cargarPaisesEnSelect() {
  let lista = ""

  sistema.paises.forEach(p => lista += `<ion-select-option value=${p.id} >${p.name}</ion-select-option>`)
  document.querySelector("#slcRegistroUsuarioPais").innerHTML = lista
}

function cargarActividades() {
  if (sistema.actividades) return Promise.resolve()

  return fetch(`${API_URL}actividades.php`,
    {
      headers: {
        "apikey": sistema.usuarioActivo.apiKey,
        "iduser": sistema.usuarioActivo.id
      }
    })
    .then((response) => {
      if (response.status != 200)
        //TODO en caso de que se use la carga de paises en otro lado, modificar como se muestra el error, tal vez hacerlo en un alert global
        document.querySelector("#pNuevoRegistroMensaje").innerHTML = "Error en el servidor, no se pueden cargar las actividades"
      return response.json()
    }).then((data) => {
      if (data.codigo == 401) {
        btnLogoutHandler()
        return
      }
      if (data.mensaje) {
        document.querySelector("#pNuevoRegistroMensaje").innerHTML = data.mensaje
      }
      sistema.actividades = data.actividades.map(a => Actividad.parse(a))
      cargarActividadesEnSelect()
    }).catch((error) => {
      console.log(error)
    })
}

function cargarActividadesEnSelect() {
  let lista = ""

  sistema.actividades.forEach(a => lista += `<ion-select-option value=${a.id} >${a.nombre}</ion-select-option>`)
  document.querySelector("#slcNuevoRegistroActividades").innerHTML = lista
}

function cargarListaRegistros() {
  document.querySelector("#pListaRegistrosMensaje").innerHTML = ""
  fetch(`${API_URL}registros.php?idUsuario=${sistema.usuarioActivo.id}`,
    {
      headers: {
        "apikey": sistema.usuarioActivo.apiKey,
        "iduser": sistema.usuarioActivo.id
      }
    })
    .then((response) => {
      if (response.status != 200)
        //TODO en caso de que se use la carga de paises en otro lado, modificar como se muestra el error, tal vez hacerlo en un alert global
        document.querySelector("#pListaRegistrosMensaje").innerHTML = "Error en el servidor, no se pueden cargar las actividades"
      return response.json()
    }).then((data) => {
      if (data.codigo == 401) {
        btnLogoutHandler()
        return
      }
      if (data.mensaje) {
        document.querySelector("#pListaRegistrosMensaje").innerHTML = data.mensaje
      }
      sistema.registros = data.registros.map(r => Registro.parse(r))
      filtrarRegistros()
    }).catch((error) => {
      console.log(error)
    })
}

function cargarRegistrosEnPantalla() {
  let registros = ""
  let actividad = new Actividad()
  sistema.registrosFiltrados.forEach(r => {
    actividad = sistema.actividades.find(a => r.idActividad == a.id)
    registros += `
      <ion-card>
        <ion-grid>
          <ion-row class="ion-align-items-center">
            <ion-col size="3">
              <img alt="${actividad.nombre}" src="${API_IMAGENES}${actividad.imagen}.png" />
            </ion-col>
            <ion-col>
                <ion-grid>
                  <ion-row class="ion-align-items-center">
                    <ion-col>
                      <ion-card-header>
                        <ion-card-title>${actividad.nombre}</ion-card-title>
                        <ion-card-subtitle>${r.tiempo} min</ion-card-subtitle>
                      </ion-card-header>
                      <ion-card-content>
                        ${r.fecha}
                      </ion-card-content>
                    </ion-col>
                    <ion-col size="3">
                      <ion-button idRegistro="${r.id}" class="btnListaRegistrosEliminar" color="medium" fill="clear" shape="round">
                          <ion-icon slot="icon-only" name="trash"></ion-icon>
                      </ion-button>
                    </ion-col>
                  </ion-row>
                </ion-grid>
            </ion-col>
          </ion-row>
        </ion-grid>
      </ion-card>
    `
  })

  document.querySelector("#dListaRegistros").innerHTML = registros
  btnListaRegistrosEliminarHandler()
}

//Manejo UI
function ocultarPantallas() {
  PANTALLA_HOME.style.display = "none"
  PANTALLA_LOGIN.style.display = "none"
  PANTALLA_REGISTRO_USUARIO.style.display = "none"
  PANTALLA_PRINCIPAL.style.display = "none"
}

function mostrarLogin() {
  ocultarPantallas()
  document.querySelector("#iLoginUsuario").value = ''
  document.querySelector("#iLoginPassword").value = ''
  document.querySelector('#pLoginMensaje').innerHTML = ''
  PANTALLA_LOGIN.style.display = "block"
}

function mostrarRegistroUsuario() {
  ocultarPantallas()
  document.querySelector("#iRegistroUsuarioUsuario").value = ''
  document.querySelector("#iRegistroUsuarioPassword").value = ''
  document.querySelector("#slcRegistroUsuarioPais").value = ''
  document.querySelector('#pRegistroUsuarioMensaje').innerHTML = ''
  PANTALLA_REGISTRO_USUARIO.style.display = "block"
}

function mostrarPrincipal() {
  ocultarPantallas()
  PANTALLA_PRINCIPAL.style.display = "block"
  MENU_TAB.select('tabListaRegistros')
}

function limpiarTabNuevoRegistro() {
  document.querySelector("#slcNuevoRegistroActividades").value = ""
  document.querySelector("#iNuevoRegistroTiempo").value = ""
  document.querySelector("#iNuevoRegistroFecha").value = ""
  document.querySelector("#pNuevoRegistroMensaje").innerHTML = ""
}

//Login
function btnLoginIngresarHandler() {
  const usuario = document.querySelector("#iLoginUsuario").value
  const password = document.querySelector("#iLoginPassword").value

  const usuarioBody = {
    usuario: usuario,
    password: password
  }

  document.querySelector("#pLoginMensaje").innerHTML = ''

  try {
    if (!usuario || !password)
      throw new Error("Se deben completar todos los datos")

    fetch(`${API_URL}login.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(usuarioBody) })
      .then((response) => {
        if (response.status != 200)
          document.querySelector("#pRegistroUsuarioMensaje").innerHTML = "Hubo un error, vuelva a intentar más tarde"
        return response.json()
      }).then((data) => {
        if (data.mensaje) {
          document.querySelector("#pLoginMensaje").innerHTML = data.mensaje
        } else {
          NAV.setRoot('page-app')
          sistema.usuarioActivo = data
          localStorage.setItem('OBDesAPKUsuarioActivo', JSON.stringify(data))
        }
      }).catch((error) => {
        console.log(error)
      })

  } catch (error) {
    document.querySelector("#pLoginMensaje").innerHTML = error
  }
}

//Logout
function btnLogoutHandler() {
  localStorage.clear()
  sistema.usuarioActivo = null
  NAV.setRoot('page-login')
  mostrarLogin()
}

//Registro de usuario
function btnRegistroUsuarioRegistrarmeHandler() {
  const usuario = document.querySelector("#iRegistroUsuarioUsuario").value
  const password = document.querySelector("#iRegistroUsuarioPassword").value
  const idPais = document.querySelector("#slcRegistroUsuarioPais").value

  const nuevoUsuario = {
    usuario: usuario,
    password: password,
    idPais: idPais
  }

  document.querySelector("#pLoginMensaje").innerHTML = ''
  document.querySelector("#pRegistroUsuarioMensaje").innerHTML = ""

  try {
    if (!usuario || !password || !idPais)
      throw new Error("Se deben completar todos los datos")

    fetch(`${API_URL}usuarios.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(nuevoUsuario) })
      .then((response) => {
        if (response.status != 200)
          document.querySelector("#pRegistroUsuarioMensaje").innerHTML = "Hubo un error, vuelva a intentar más tarde"
        return response.json()
      }).then((data) => {
        if (data.mensaje) {
          document.querySelector("#pRegistroUsuarioMensaje").innerHTML = data.mensaje
        } else {
          document.querySelector("#pLoginMensaje").innerHTML = `Gracias por registrarte, ahora inicia sesión para ingresar`
          NAV.popToRoot()
          mostrarLogin()
        }
      }).catch((error) => {
        console.log(error)
      })


  } catch (error) {
    document.querySelector("#pRegistroUsuarioMensaje").innerHTML = error
  }
}

//Registro de actividad
function btnNuevoRegistroHandler() {
  const idActividad = document.querySelector("#slcNuevoRegistroActividades").value
  const tiempo = document.querySelector("#iNuevoRegistroTiempo").value
  const fecha = document.querySelector("#iNuevoRegistroFecha").value

  const nuevaActividad = {
    idActividad: idActividad,
    idUsuario: sistema.usuarioActivo.id,
    tiempo: tiempo,
    fecha: fecha
  }

  const fechaHoy = new Date()
  const fechaIngresada = new Date(fecha + "T00:00")
  try {
    if (!idActividad || !tiempo || !fecha)
      throw new Error("Se deben completar todos los datos")
    if (fechaIngresada > fechaHoy)
      throw new Error("La fecha no puede ser posterior a hoy")

    fetch(`${API_URL}registros.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": sistema.usuarioActivo.apiKey,
        "iduser": sistema.usuarioActivo.id
      },
      body: JSON.stringify(nuevaActividad)
    })
      .then((response) => {
        if (response.status != 200)
          document.querySelector("#pNuevoRegistroMensaje").innerHTML = "Hubo un error, vuelva a intentar más tarde"
        return response.json()
      }).then((data) => {
        if (data.codigo == 401) {
          btnLogoutHandler()
          return
        }
        document.querySelector("#pNuevoRegistroMensaje").innerHTML = data.mensaje
        cargarRegistrosEnPantalla()
      }).catch((error) => {
        console.log(error)
      })


  } catch (error) {
    document.querySelector("#pNuevoRegistroMensaje").innerHTML = error
  }
}

//Eliminar registro
function btnListaRegistrosEliminarHandler() {
  const botones = document.querySelectorAll(".btnListaRegistrosEliminar")
  botones.forEach(b => (b.addEventListener("click", eliminarRegistro)))
}

function eliminarRegistro() {
  const idRegistro = this.getAttribute("idRegistro")

  fetch(`${API_URL}registros.php?idRegistro=${idRegistro}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "apikey": sistema.usuarioActivo.apiKey,
      "iduser": sistema.usuarioActivo.id
    }
  })
    .then((response) => {
      if (response.status != 200)
        //TODO Cambiar todos los p de mensaje por un toast
        document.querySelector("#pListaRegistrosMensaje").innerHTML = "Hubo un error, vuelva a intentar más tarde"
      return response.json()
    }).then((data) => {
      if (data.codigo == 401) {
        btnLogoutHandler()
        return
      }
      document.querySelector("#pListaRegistrosMensaje").innerHTML = data.mensaje
      cargarListaRegistros()
    }).catch((error) => {
      console.log(error)
    })
}

//Filtrar registros
function filtrarRegistros() {
  const periodo = document.querySelector("#rFiltroRegistros").value
  let fechaLimite = new Date()

  switch (periodo) {
    case "todo":
      sistema.registrosFiltrados = sistema.registros
      break
    case "semana":
      fechaLimite.setDate(fechaLimite.getDate() - 7)
      sistema.registrosFiltrados = sistema.registros.filter(r => (
        new Date(r.fecha + "T00:00") >= fechaLimite
      ))
      break
    case "mes":
      fechaLimite.setMonth(fechaLimite.getMonth() - 1)
      sistema.registrosFiltrados = sistema.registros.filter(r => (
        new Date(r.fecha + "T00:00") >= fechaLimite
      ))
      break
  }
  cargarRegistrosEnPantalla()
}