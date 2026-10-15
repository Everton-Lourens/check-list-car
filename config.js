// Configuração padrão do checklist. O cache do navegador tem precedência quando contém valor.
window.APP_CONFIG = {
  "cacheDatabaseName": "jr-telecom-checklist-cache-v1",
  "cacheStoreName": "valores",
  "cachePrefix": "jr-telecom-checklist-cache-v1:",
  "serverUrl": "https://script.google.com/macros/s/AKfycbygJDaJBowduYbs6grNasPxCAJbj7jm-MNFfuslNfVQswwlez-AX82_Oiz4MqPzwBNlMQ/exec",
  "publicFolder": "./public/",
  "kmIncrementoDiario": 30,
  "veiculos": [
    {
      "codigo": "150",
      "modelo": "ARGO",
      "placa": "SJW-1A29"
    },
    {
      "codigo": "151",
      "modelo": "ARGO",
      "placa": "SJW-1H08"
    },
    {
      "codigo": "152",
      "modelo": "ARGO",
      "placa": "SJW-4E61"
    },
    {
      "codigo": "153",
      "modelo": "ARGO",
      "placa": "SJW-7A36"
    },
    {
      "codigo": "155",
      "modelo": "ARGO",
      "placa": "SJW-4C77"
    },
    {
      "codigo": "156",
      "modelo": "ARGO",
      "placa": "SJW-5D03"
    },
    {
      "codigo": "157",
      "modelo": "ARGO",
      "placa": "SJW6C25"
    },
    {
      "codigo": "158",
      "modelo": "ARGO",
      "placa": "SJW-9G24"
    },
    {
      "codigo": "159",
      "modelo": "ARGO",
      "placa": "SJW-9D35"
    },
    {
      "codigo": "160",
      "modelo": "ARGO",
      "placa": "SJW-5A24"
    },
    {
      "codigo": "171",
      "modelo": "STRADA",
      "placa": "SKF-5I71"
    },
    {
      "codigo": "188",
      "modelo": "STRADA",
      "placa": "SPA-8A95"
    },
    {
      "codigo": "202",
      "modelo": "STRADA",
      "placa": "TMP-4B20"
    },
    {
      "codigo": "210",
      "modelo": "STRADA",
      "placa": "TMW5F39"
    },
    {
      "codigo": "211",
      "modelo": "STRADA",
      "placa": "TMW0F74"
    },
    {
      "codigo": "222",
      "modelo": "MOBI",
      "placa": "TMZ0H23"
    }
  ],
  "condutores": [
    "DENILSON MOISES",
    "EDENILDO JESUS DE ASSIS",
    "EDSON HENRIQUE ALVES FONSECA",
    "EDUARDO JESUS DOS SANTOS",
    "EGINALDO JEFERSON VELOSO DE AMORIM",
    "ELDER ALMEIDA SANTOS",
    "EVERTON LOURENÇO DA SILVA",
    "FELIPE DA SILVA NUNES",
    "HENRIQUE ANTONIO NASCIMENTO DA SILVA",
    "IGOR JOSE NEVES DE OLIVEIRA",
    "IGOR SANTOS DE JESUS",
    "IGOR VIEIRA SANTANA",
    "JONAS REIS RAMOS",
    "KLEYTON SANTOS DE SOUSA",
    "LUAN DA SILVA CONCEIÇAO",
    "MARCUS PAULO GOMES PAIM",
    "MARIANA SILVA DE BRITO",
    "PAULO HENRIQUE DOS REIS",
    "RIAN ASSIS DE ALMEIDA",
    "THIAGO ALMEIDA SILVA",
    "THIAGO SANTANA DA SILVA",
    "UZIEL SANTANA SILVA",
    "WASHINGTON DA CONCEICAO SANTANA",
    "YURI SANTOS ARIZI"
  ],
  "itensChecklist": [
    "Documento do veículo",
    "Cinto de segurança, bancos e tapetes em boas condições?",
    "Vidros laterais, espelhos, para-brisa dianteiro e traseiro sem trincas?",
    "Faróis, lâmpadas, pisca-alertas, luz interna e luz de ré funcionando?",
    "Pintura, plotagem e funilaria em bom estado?",
    "Pneus em boas condições?",
    "Engate e elétrica do reboque funcionando?",
    "Apresentando algum vazamento?",
    "Nível de óleo do motor e hidráulico, água esguicho, fluído de freio, líq. de arrefecimento?",
    "Painel e botões do painel funcionando adequadamente?",
    "Estepe, macaco, chave de roda e triângulo em boas condições?",
    "Limpeza externa e interna"
  ],
  "fotosPorTipo": {
    "Entrada": [
      "e-painel-km.jpeg",
      "e-motor.jpeg",
      "e-frente.jpeg",
      "e-pneu.jpeg",
      "e-interior.jpeg"
    ],
    "Saída": [
      "s-painel-km.jpeg",
      "s-motor.jpeg",
      "s-frente.jpeg",
      "s-pneu.jpeg",
      "s-interior.jpeg"
    ]
  },
  "defaults": {
    "veiculo": "150",
    "condutor": "DENILSON MOISES",
    "pin": "5524",
    "tipo": "Entrada",
    "km": "4828",
    "observacao": "",
    "itens": [
      "C",
      "C",
      "C",
      "C",
      "C",
      "C",
      "C",
      "C",
      "C",
      "C",
      "C",
      "C"
    ],
    "selfieFoto": "selfie-condutor.jpeg",
    "assinaturaDataUrl": null,
    "assinaturaDemonstrativa": true,
    "assinaturaDemoTexto": "Assinatura de teste"
  }
};
