//Globales
const API_URL = "https://movetrack.develotion.com/"
const API_IMAGENES = "https://movetrack.develotion.com/imgs/"
let map = null

//DOM
const ROUTER = document.querySelector("#ruteo")
const NAV = document.querySelector("#nav")

const PANTALLA_HOME = document.querySelector("#pageHome")
const PANTALLA_CARGA = document.querySelector("#pageCargando")
const PANTALLA_LOGIN = document.querySelector("#pageLogin")
const PANTALLA_REGISTRO_USUARIO = document.querySelector("#pageRegistroUsuario")
const PANTALLA_PRINCIPAL = document.querySelector("#pageApp")
const MENU_TAB = document.querySelector('#tabMain')
const MODAL_AGREGAR_ACTIVIDAD = document.querySelector('#modAgregarActividad')
const MAPA = document.querySelector("#miMapa")

// Inicializaci n del sistema
inicializar()

function inicializar() {
  subscripcionAEventos()
  sistema.verificarUsuarioLocalStorage()
}

function subscripcionAEventos() {
  // Routeo
  ROUTER.addEventListener("ionRouteDidChange", navegar)
  MENU_TAB.addEventListener("ionTabsDidChange", navegarTab)

  //Filtros
  document.querySelectorAll(".pill").forEach(f => {
    f.addEventListener("click", (e) => {
      const periodo = e.target.getAttribute('value')
      filtrarRegistrosEnActividades(periodo)

      //Cambiar estilo
      document.querySelectorAll('.pill-selected').forEach(ps => {
        ps.classList.remove('pill-selected')
      })
      f.classList.add('pill-selected')
    })
  })
}

//Navegacion
function navegar(e) {
  const ruta = e.detail.to
  switch (ruta) {
    case "/":
      mostrarPantallaDeCarga()
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
      mostrarPantallaDeCarga()
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
    case "tabTiempos":
      tiempos()
      break;
    case "tabActividades":
      cargarListaRegistros()
      break;
    case "tabMapaUsuarios":
      cargarMapa()
      break;
  }
}

function cargarPaises() {
  if (sistema.paises) return Promise.resolve()

  return fetch(`${API_URL}paises.php`)
    .then((response) => {
      if (response.status != 200)
        mostrarToast('ERROR', '', 'Hubo un error, vuelva a intentar más tarde')
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
        mostrarToast('ERROR', '', 'Hubo un error, vuelva a intentar más tarde')
      return response.json()
    }).then((data) => {
      if (data.codigo == 401) {
        btnLogoutHandler()
        return
      }
      if (data.mensaje) {
        mostrarToast('ERROR', '', data.mensaje)

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
  fetch(`${API_URL}registros.php?idUsuario=${sistema.usuarioActivo.id}`,
    {
      headers: {
        "apikey": sistema.usuarioActivo.apiKey,
        "iduser": sistema.usuarioActivo.id
      }
    })
    .then((response) => {
      if (response.status != 200)
        mostrarToast('ERROR', '', 'Hubo un error, vuelva a intentar más tarde')

      return response.json()
    }).then((data) => {
      if (data.codigo == 401) {
        btnLogoutHandler()
        return
      }
      if (data.mensaje) {
        mostrarToast('ERROR', '', data.mensaje)

      }
      sistema.registros = data.registros.map(r => Registro.parse(r))

      const periodo = document.querySelector(".pill-selected").getAttribute("value")
      filtrarRegistrosEnActividades(periodo)
      if (data.registros.length > 0) {
        document.querySelector('#pActividadesEspacioVacio').style.display = 'none'
      } else {
        document.querySelector('#pActividadesEspacioVacio').style.display = 'block'
      }
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

function abrirModal() {
  limpiarModNuevoRegistro()
  MODAL_AGREGAR_ACTIVIDAD.present()
}

function cerrarModal() {
  MODAL_AGREGAR_ACTIVIDAD.dismiss()
  tiempos()
}

//Manejo UI
function ocultarPantallas() {
  PANTALLA_HOME.style.display = "none"
  PANTALLA_CARGA.style.display = 'none'
  PANTALLA_LOGIN.style.display = "none"
  PANTALLA_REGISTRO_USUARIO.style.display = "none"
  PANTALLA_PRINCIPAL.style.display = "none"
}

function mostrarPantallaDeCarga() {
  ocultarPantallas()
  PANTALLA_CARGA.style.display = 'block'
}

function mostrarLogin() {
  ocultarPantallas()
  document.querySelector("#iLoginUsuario").value = ''
  document.querySelector("#iLoginPassword").value = ''
  PANTALLA_LOGIN.style.display = "block"
}

function mostrarRegistroUsuario() {
  ocultarPantallas()
  document.querySelector("#iRegistroUsuarioUsuario").value = ''
  document.querySelector("#iRegistroUsuarioPassword").value = ''
  document.querySelector("#slcRegistroUsuarioPais").value = ''
  PANTALLA_REGISTRO_USUARIO.style.display = "block"
}

function mostrarPrincipal() {
  ocultarPantallas()
  PANTALLA_PRINCIPAL.style.display = "block"
  MENU_TAB.select('tabActividades')
}

function limpiarModNuevoRegistro() {
  document.querySelector("#slcNuevoRegistroActividades").value = ""
  document.querySelector("#iNuevoRegistroTiempo").value = ""
  document.querySelector("#iNuevoRegistroFecha").value = ""
}

//Login
function btnLoginIngresarHandler() {
  const usuario = document.querySelector("#iLoginUsuario").value
  const password = document.querySelector("#iLoginPassword").value

  const usuarioBody = {
    usuario: usuario,
    password: password
  }

  try {
    if (!usuario || !password)
      throw new Error("Se deben completar todos los datos")

    fetch(`${API_URL}login.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(usuarioBody) })
      .then((response) => {
        if (response.status != 200)
          mostrarToast('ERROR', '', 'Hubo un error, vuelva a intentar más tarde')
        return response.json()
      }).then((data) => {
        if (data.mensaje) {
          mostrarToast('ERROR', '', data.mensaje)
        } else {
          NAV.setRoot('page-app')
          sistema.usuarioActivo = data
          localStorage.setItem('OBDesAPKUsuarioActivo', JSON.stringify(data))
        }
      }).catch((error) => {
        console.log(error)
      })

  } catch (error) {
    mostrarToast('ERROR', '', error.message)
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

  try {
    //Validaciones
    if (!usuario || !password || !idPais)
      throw new Error("Se deben completar todos los datos")
    if (password.length < 8)
      throw new Error("La contraseña debe tener al menos 8 caracteres")
    if (!(sistema.paises.find(p => p.id == idPais)))
      throw new Error("El país ingresado no es valido")

    fetch(`${API_URL}usuarios.php`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(nuevoUsuario) })
      .then((response) => {
        if (response.status != 200)
          mostrarToast('ERROR', '', 'Hubo un error, vuelva a intentar más tarde')

        return response.json()
      }).then((data) => {
        if (data.mensaje) {
          mostrarToast('ERROR', '', data.mensaje)
        } else {
          NAV.setRoot('page-app')
          sistema.usuarioActivo = data
          localStorage.setItem('OBDesAPKUsuarioActivo', JSON.stringify(data))
        }
      }).catch((error) => {
        console.log(error)
      })


  } catch (error) {
    mostrarToast('ERROR', '', error.message)
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
    //Validaciones
    if (!idActividad || !tiempo || !fecha)
      throw new Error("Se deben completar todos los datos")
    if (!(tiempo > 0))
      throw new Error("El tiempo debe ser mayor a 0 minutos")
    if (fechaIngresada > fechaHoy)
      throw new Error("La fecha no puede ser posterior a hoy")
    if (!(sistema.actividades.find(a => a.id == idActividad)))
      throw new Error("La actividad ingresada no es valida")

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
          mostrarToast("ERROR", "", "Hubo un error, vuelva a intentar más tarde")
        return response.json()
      }).then((data) => {
        if (data.codigo == 401) {
          btnLogoutHandler()
          return
        }
        document.querySelector("#slcNuevoRegistroActividades").value = ""
        document.querySelector("#iNuevoRegistroTiempo").value = ""
        document.querySelector("#iNuevoRegistroFecha").value = ""
        mostrarToast("SUCCESS", "", data.mensaje)
        cargarListaRegistros()
      }).catch((error) => {
        console.log(error)
      })


  } catch (error) {
    mostrarToast("ERROR", "", error.message)
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
        mostrarToast("ERROR", "", "Hubo un error, vuelva a intentar más tarde")
      return response.json()
    }).then((data) => {
      if (data.codigo == 401) {
        btnLogoutHandler()
        return
      }
      mostrarToast("SUCCESS", "", data.mensaje)
      cargarListaRegistros()
    }).catch((error) => {
      console.log(error)
    })
}

//Filtrar registros
function filtrarRegistrosEnActividades(periodo) {
  sistema.filtrarRegistrosPorPeriodo(periodo)
  cargarRegistrosEnPantalla()
}

//Mostrar tiempo de entrenamiento
function tiempos() {
  document.querySelector('#tiempoTotal').innerHTML = `${sistema.tiempoTotal().toFixed(2)} hs`
  document.querySelector('#tiempoDiario').innerHTML = `${sistema.tiempoDelDia()} min`
}

//Mapa
function cargarMapa() {
  //Se ejecuta hasta que el div este dibujado
  if (MAPA.offsetHeight == 0 || MAPA.offsetWidth == 0) {
    setTimeout(() => {
      cargarMapa()
    }, 100)
    return
  }

  if (!map)
    map = L.map('miMapa')

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map)

  let coordenadas = sistema.paises.map(p => {
    if (p.marker) {
      p.marker.closeTooltip()
    } else {
      p.marker = L.marker([p.latitude, p.longitude]).addTo(map)
    }
    p.marker.bindTooltip(p.name, {
      permanent: true,
      direction: "bottom",
      offset: [-15, 30] // Ajusta la posición del texto respecto al marcador
    })
    return [p.latitude, p.longitude]
  })

  map.invalidateSize()

  if (coordenadas.length > 0) {
    map.fitBounds(coordenadas)
    cargarCantidadDeUsuariosPorPais()
  } else {
    map.setView([-34.90376119736271, -56.19063145518495], 18)
  }
}

function cargarCantidadDeUsuariosPorPais() {
  fetch(`${API_URL}usuariosPorPais.php`, {
    headers: {
      "apikey": sistema.usuarioActivo.apiKey,
      "iduser": sistema.usuarioActivo.id
    }
  })
    .then((response) => {
      if (response.status != 200)
        mostrarToast('ERROR', 'Error', 'Error en el servidor, no se pueden cargar las actividades')
      return response.json()
    }).then((data) => {
      if (data.codigo == 401) {
        btnLogoutHandler()
        return
      }
      //Actualiza los markers con los usuarios por pais
      sistema.paises.forEach(p => {
        const pais = data.paises.find(pData => pData.id == p.id)
        p.marker.setTooltipContent(`${p.name}<br>${pais.cantidadDeUsuarios} usuarios`)
      })

    }).catch((error) => {
      console.log(error)
    })
}

/* Mensajes */
async function mostrarToast(tipo, titulo, mensaje) {
  const toast = document.createElement('ion-toast');
  toast.header = titulo;
  toast.message = mensaje;
  toast.position = 'bottom';
  toast.duration = 2000;
  if (tipo === "ERROR") {
    toast.color = "danger";
  } else if (tipo === "SUCCESS") {
    toast.color = "success";
  } else if (tipo === "WARNING") {
    toast.color = "warning";
  }

  document.body.appendChild(toast);
  return toast.present();
}