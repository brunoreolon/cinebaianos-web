const usuarios = [
    {
        "discordId": "405389229762281473",
        "name": "FabioParadyze",
        "email": "bruno.reolonn+user3@gmail.com",
        "avatar": "https://cdn.discordapp.com/avatars/405389229762281473/faf62e68f3df357ec9853f27da382760.webp?size=80",
        "isBot": false,
        "created": "01/01/2025",
        "isAtivo": true,
        "isAdmin": false,
        "biograpy": "teste fabio teste fabio teste fabio  teste fabioteste fabio  teste fabio teste fabio"
    },
    {
        "discordId": "271749848842108928",
        "name": "Ro00dr1go",
        "email": "bruno.reolonn+user4@gmail.com",
        "avatar": "https://cdn.discordapp.com/avatars/271749848842108928/e4b2ef4d373ee4ba41400e14176fac9a.webp?size=80",
        "isBot": false,
        "created": "01/01/2025",
        "isAtivo": false,
        "isAdmin": false,
        "biograpy": "teste rodrigo teste rodrigo teste rodrigo teste rodrigo teste rodrigo teste rodrigo teste rodrigo "
    },
    {
        "discordId": "339251538998329354",
        "name": "Bruno Reolon",
        "email": "bruno.reolonn@gmail.com",
        "avatar": "https://cdn.discordapp.com/avatars/339251538998329354/e9649bda48db6522e66fdda5bc06e748.webp?size=80",
        "isBot": false,
        "created": "01/01/2025",
        "isAtivo": true,
        "isAdmin": true,
        "biograpy": "teste bruno teste bruno teste bruno teste bruno teste bruno teste bruno"
    },
    {
        "discordId": "555470950892568576",
        "name": "AʟᴍɪʀVXɢᴀᴍᴇʀ",
        "email": "bruno.reolonn+user2@gmail.com",
        "avatar": "https://cdn.discordapp.com/avatars/555470950892568576/a_265afa3ac80758e62a5b6be02ab576f7.webp?size=80",
        "isBot": false,
        "created": "01/01/2025",
        "isAtivo": true,
        "isAdmin": false,
        "biograpy": "teste almir teste almir teste almir teste almir  teste almir teste almir teste almirteste almir "
    },
    {
        "discordId": "1395999365931339806",
        "name": "CineBaianos",
        "email": "bruno.reolonn+user99@gmail.com",
        "avatar": "https://cdn.discordapp.com/avatars/1395999365931339806/7d6d11bb0b6177c5ddcefa0c0b235a08.webp?size=80",
        "isBot": true,
        "created": "01/01/2025",
        "isAtivo": true,
        "isAdmin": false
    }
]

const votos = [
    {
        "id": 1,
        "name": "DA_HORA",
        "description": "Da Hora",
        "color": "#00FF00",
        "emoji": "🏆",
        "active": true
    },
    {
        "id": 2,
        "name": "LIXO",
        "description": "Lixo",
        "color": "#FF0000",
        "emoji": "💩",
        "active": true
    },
    {
        "id": 3,
        "name": "NAO_ASSISTI",
        "description": "Não Assisti",
        "color": "#AAAAAA",
        "emoji": "💤",
        "active": true
    }
]

const filmesAdicionar = [
    {
        "movie": {
            "id": 1,
            "title": "O Predador: A Caçada",
            "genre": "Thriller",
            "year": "2022",
            "tmdbId": "766507",
            "dateAdded": "2025-09-14T03:28:57.63",
            "posterPath": "",
            "synopsis": "O geofísico Dr. Josh Keyes descobre que um experimento fracassado interrompeu a rotação da Terra. Para tentar descobrir o que está havendo e resolver a crise, Josh escala uma equipe com alguns dos mais brilhantes cientistas do mundo, que tem por missão ir até o núcleo da Terra para reativar a rotação do planeta."
        }
    },
    {
        "movie": {
            "id": 2,
            "title": "Alien: Covenant",
            "genre": "Terror",
            "year": "2017",
            "tmdbId": "126889",
            "dateAdded": "2025-09-14T03:28:58.67",
            "posterPath": "https://image.tmdb.org/t/p/original/dNJqsL3ekBPUXsSDu6oABGZkJMM.jpg",
            "synopsis": "O pai suburbano Hutch Mansell, ex-assassino letal, é levado de volta ao seu passado violento depois de impedir uma invasão domiciliar, desencadeando uma cadeia de eventos que revela segredos sobre o passado de sua esposa Becca."
        }
    },
    {
        "movie": {
            "id": 3,
            "title": "Operação Valquíria",
            "genre": "Drama",
            "year": "2008",
            "tmdbId": "2253",
            "dateAdded": "2025-09-11T03:28:59.652",
            "posterPath": "https://image.tmdb.org/t/p/original/ud8eldqnwQWReI2aDBVfLE5lVip.jpg",
            "synopsis": "Ambientado há 300 anos na Nação Comanche, esta é a história de Naru, uma guerreira destemida e hábil, criada na sombra dos lendários caçadores que habitam as Grandes Planícies. Quando um perigo ameaça seu povo, ela parte para protegê-los. Porém, sua presa é um predador alienígena altamente evoluído munido com armas tecnologicamente avançadas."
        }
    },
]

const filmes = [
    {
        "movie": {
            "id": 1,
            "title": "O Predador: A Caçada",
            "genre": "Thriller",
            "year": "2022",
            "tmdbId": "766507",
            "dateAdded": "2025-09-14T03:28:57.63",
            "posterPath": "",
            "chooser": {
                "discordId": "339251538998329354",
                "name": "Bruno Reolon"
            }
        },
        "votes": [
            {
                "voter": {
                    "discordId": "339251538998329354",
                    "name": "Bruno Reolon"
                },
                "vote": {
                    "id": 2,
                    "description": "Lixo",
                    "color": "#00FF00",
                    "emoji": "🏆"
                }
            },
            {
                "voter": {
                    "discordId": "555470950892568576",
                    "name": "AʟᴍɪʀVXɢᴀᴍᴇʀ"
                },
                "vote": {
                    "id": 2,
                    "description": "Lixo",
                    "color": "#FF0000",
                    "emoji": "💩"
                }
            },
            {
                "voter": {
                    "discordId": "271749848842108928",
                    "name": "Ro00dr1go"
                },
                "vote": {
                    "id": 2,
                    "description": "Lixo",
                    "color": "#FF0000",
                    "emoji": "💩"
                }
            },
            {
                "voter": {
                    "discordId": "405389229762281473",
                    "name": "FabioParadyze"
                },
                "vote": {
                    "id": 3,
                    "description": "Não Assisti",
                    "color": "#AAAAAA",
                    "emoji": "💤"
                }
            }
        ]
    },
    {
        "movie": {
            "id": 2,
            "title": "Alien: Covenant",
            "genre": "Terror",
            "year": "2017",
            "tmdbId": "126889",
            "dateAdded": "2025-09-14T03:28:58.67",
            "posterPath": "https://image.tmdb.org/t/p/original/dNJqsL3ekBPUXsSDu6oABGZkJMM.jpg",
            "chooser": {
                "discordId": "339251538998329354",
                "name": "Bruno Reolon"
            }
        },
        "votes": [
            {
                "voter": {
                    "discordId": "555470950892568576",
                    "name": "AʟᴍɪʀVXɢᴀᴍᴇʀ"
                },
                "vote": {
                    "id": 1,
                    "description": "Da Hora",
                    "color": "#00FF00",
                    "emoji": "🏆"
                }
            },
            {
                "voter": {
                    "discordId": "271749848842108928",
                    "name": "Ro00dr1go"
                },
                "vote": {
                    "id": 1,
                    "description": "Da Hora",
                    "color": "#00FF00",
                    "emoji": "🏆"
                }
            },
            {
                "voter": {
                    "discordId": "405389229762281473",
                    "name": "FabioParadyze"
                },
                "vote": {
                    "id": 1,
                    "description": "Da Hora",
                    "color": "#00FF00",
                    "emoji": "🏆"
                }
            }
        ]
    },
    {
        "movie": {
            "id": 3,
            "title": "Operação Valquíria",
            "genre": "Drama",
            "year": "2008",
            "tmdbId": "2253",
            "dateAdded": "2025-09-11T03:28:59.652",
            "posterPath": "https://image.tmdb.org/t/p/original/ud8eldqnwQWReI2aDBVfLE5lVip.jpg",
            "chooser": {
                "discordId": "339251538998329354",
                "name": "Bruno Reolon"
            }
        },
        "votes": [
            // {
            //     "voter": {
            //         "discordId": "339251538998329354",
            //         "name": "Bruno Reolon"
            //     },
            //     "vote": {
            //         "id": 1,
            //         "description": "Da Hora",
            //         "color": "#00FF00",
            //         "emoji": "🏆"
            //     }
            // },
            {
                "voter": {
                    "discordId": "555470950892568576",
                    "name": "AʟᴍɪʀVXɢᴀᴍᴇʀ"
                },
                "vote": {
                    "id": 1,
                    "description": "Da Hora",
                    "color": "#00FF00",
                    "emoji": "🏆"
                }
            },
            {
                "voter": {
                    "discordId": "271749848842108928",
                    "name": "Ro00dr1go"
                },
                "vote": {
                    "id": 1,
                    "description": "Da Hora",
                    "color": "#00FF00",
                    "emoji": "🏆"
                }
            },
            {
                "voter": {
                    "discordId": "405389229762281473",
                    "name": "FabioParadyze"
                },
                "vote": {
                    "id": 1,
                    "description": "Da Hora",
                    "color": "#00FF00",
                    "emoji": "🏆"
                }
            }
        ]
    },
    {
        "movie": {
            "id": 4,
            "title": "O Senhor das Armas",
            "genre": "Crime",
            "year": "2005",
            "tmdbId": "1830",
            "dateAdded": "2025-09-14T03:28:59.124",
            "posterPath": "https://image.tmdb.org/t/p/original/yLxbDZ1h7wbHo7mkyX5AR9hjODe.jpg",
            "chooser": {
                "discordId": "339251538998329354",
                "name": "Bruno Reolon"
            }
        },
        "votes": [
            {
                "voter": {
                    "discordId": "339251538998329354",
                    "name": "Bruno Reolon"
                },
                "vote": {
                    "id": 1,
                    "description": "Da Hora",
                    "color": "#00FF00",
                    "emoji": "🏆"
                }
            },
            {
                "voter": {
                    "discordId": "555470950892568576",
                    "name": "AʟᴍɪʀVXɢᴀᴍᴇʀ"
                },
                "vote": {
                    "id": 1,
                    "description": "Da Hora",
                    "color": "#00FF00",
                    "emoji": "🏆"
                }
            },
            {
                "voter": {
                    "discordId": "271749848842108928",
                    "name": "Ro00dr1go"
                },
                "vote": {
                    "id": 1,
                    "description": "Da Hora",
                    "color": "#00FF00",
                    "emoji": "🏆"
                }
            },
            {
                "voter": {
                    "discordId": "405389229762281473",
                    "name": "FabioParadyze"
                },
                "vote": {
                    "id": 1,
                    "description": "Da Hora",
                    "color": "#00FF00",
                    "emoji": "🏆"
                }
            }
        ]
    },
    {
        "movie": {
        "id": 5,
        "title": "Stalingrado - A Batalha Final",
        "genre": "Drama",
        "year": "1993",
        "tmdbId": "11101",
        "dateAdded": "2025-09-14T03:29:00.134",
        "posterPath": "https://image.tmdb.org/t/p/original/gQ2yJ2WLG1mmucjlq0Z0p0tS8EB.jpg",
        "chooser": {
            "discordId": "339251538998329354",
            "name": "Bruno Reolon"
        }
    },
    "votes": [
            {
                "voter": {
                    "discordId": "339251538998329354",
                    "name": "Bruno Reolon"
                },
                "vote": {
                    "id": 1,
                    "description": "Da Hora",
                    "color": "#00FF00",
                    "emoji": "🏆"
                }
            },
            {
                "voter": {
                    "discordId": "555470950892568576",
                    "name": "AʟᴍɪʀVXɢᴀᴍᴇʀ"
                },
                "vote": {
                    "id": 2,
                    "description": "Lixo",
                    "color": "#FF0000",
                    "emoji": "💩"
                }
            },
            {
                "voter": {
                    "discordId": "271749848842108928",
                    "name": "Ro00dr1go"
                },
                "vote": {
                    "id": 1,
                    "description": "Da Hora",
                    "color": "#00FF00",
                    "emoji": "🏆"
                }
            },
            {
                "voter": {
                    "discordId": "405389229762281473",
                    "name": "FabioParadyze"
                },
                "vote": {
                    "id": 1,
                    "description": "Da Hora",
                    "color": "#00FF00",
                    "emoji": "🏆"
                }
            }
        ]
    },
    {
        "movie": {
            "id": 6,
            "title": "O Núcleo: Missão ao Centro da Terra",
            "genre": "Ficção científica",
            "year": "2003",
            "tmdbId": "9341",
            "dateAdded": "2025-09-14T03:29:01.118",
            "posterPath": "https://image.tmdb.org/t/p/original/8fgCPqrF94rfXw4cSJjexxcGL8l.jpg",
            "chooser": {
                "discordId": "339251538998329354",
                "name": "Bruno Reolon"
            }
        },
        "votes": [
            {
                "voter": {
                    "discordId": "339251538998329354",
                    "name": "Bruno Reolon"
                },
                "vote": {
                    "id": 1,
                    "description": "Da Hora",
                    "color": "#00FF00",
                    "emoji": "🏆"
                }
            },
            {
                "voter": {
                    "discordId": "555470950892568576",
                    "name": "AʟᴍɪʀVXɢᴀᴍᴇʀ"
                },
                "vote": {
                    "id": 1,
                    "description": "Da Hora",
                    "color": "#00FF00",
                    "emoji": "🏆"
                }
            },
            {
                "voter": {
                    "discordId": "271749848842108928",
                    "name": "Ro00dr1go"
                },
                "vote": {
                    "id": 1,
                    "description": "Da Hora",
                    "color": "#00FF00",
                    "emoji": "🏆"
                }
            },
            {
                "voter": {
                    "discordId": "405389229762281473",
                    "name": "FabioParadyze"
                },
                "vote": {
                    "id": 2,
                    "description": "Lixo",
                    "color": "#FF0000",
                    "emoji": "💩"
                }
            }
        ]
    },
    {
        "movie": {
            "id": 7,
            "title": "Beleza Oculta",
            "genre": "Drama",
            "year": "2016",
            "tmdbId": "345920",
            "dateAdded": "2025-09-14T03:29:02.113",
            "posterPath": "https://image.tmdb.org/t/p/original/l7rwGxhH2ZDaViuxzT0qMPfhfo3.jpg",
            "chooser": {
                "discordId": "339251538998329354",
                "name": "Bruno Reolon"
            }
        },
        "votes": [
            {
                "voter": {
                    "discordId": "339251538998329354",
                    "name": "Bruno Reolon"
                },
                "vote": {
                    "id": 1,
                    "description": "Da Hora",
                    "color": "#00FF00",
                    "emoji": "🏆"
                }
            },
            {
                "voter": {
                    "discordId": "555470950892568576",
                    "name": "AʟᴍɪʀVXɢᴀᴍᴇʀ"
                },
                "vote": {
                    "id": 1,
                    "description": "Da Hora",
                    "color": "#00FF00",
                    "emoji": "🏆"
                }
            },
            {
                "voter": {
                    "discordId": "271749848842108928",
                    "name": "Ro00dr1go"
                },
                "vote": {
                    "id": 1,
                    "description": "Da Hora",
                    "color": "#00FF00",
                    "emoji": "🏆"
                }
            },
            {
                "voter": {
                    "discordId": "405389229762281473",
                    "name": "FabioParadyze"
                },
                "vote": {
                    "id": 1,
                    "description": "Da Hora",
                    "color": "#00FF00",
                    "emoji": "🏆"
                }
            }
        ]
    },
    {
        "movie": {
            "id": 8,
            "title": "A Guerra dos Mundos",
            "genre": "Ficção científica",
            "year": "2025",
            "tmdbId": "755898",
            "dateAdded": "2025-09-14T03:29:03.077",
            "posterPath": "https://image.tmdb.org/t/p/original/yvirUYrva23IudARHn3mMGVxWqM.jpg",
            "chooser": {
                "discordId": "339251538998329354",
                "name": "Bruno Reolon"
            }
        },
        "votes": [
            {
                "voter": {
                    "discordId": "339251538998329354",
                    "name": "Bruno Reolon"
                },
                "vote": {
                    "id": 2,
                    "description": "Lixo",
                    "color": "#FF0000",
                    "emoji": "💩"
                }
            },
            {
                "voter": {
                    "discordId": "555470950892568576",
                    "name": "AʟᴍɪʀVXɢᴀᴍᴇʀ"
                },
                "vote": {
                    "id": 2,
                    "description": "Lixo",
                    "color": "#FF0000",
                    "emoji": "💩"
                }
            },
            {
                "voter": {
                    "discordId": "271749848842108928",
                    "name": "Ro00dr1go"
                },
                "vote": {
                    "id": 2,
                    "description": "Lixo",
                    "color": "#FF0000",
                    "emoji": "💩"
                }
            },
            {
                "voter": {
                    "discordId": "405389229762281473",
                    "name": "FabioParadyze"
                },
                "vote": {
                    "id": 3,
                    "description": "Não Assisti",
                    "color": "#AAAAAA",
                    "emoji": "💤"
                }
            }
        ]
    },
    {
        "movie": {
            "id": 9,
            "title": "Cães de Guerra",
            "genre": "Comédia",
            "year": "2016",
            "tmdbId": "308266",
            "dateAdded": "2025-09-14T03:29:04.045",
            "posterPath": "https://image.tmdb.org/t/p/original/39Wqg43QEm1DYptJoZPCK1R7OWJ.jpg",
            "chooser": {
                "discordId": "339251538998329354",
                "name": "Bruno Reolon"
            }
        },
        "votes": [
            {
                "voter": {
                    "discordId": "339251538998329354",
                    "name": "Bruno Reolon"
                },
                "vote": {
                    "id": 1,
                    "description": "Da Hora",
                    "color": "#00FF00",
                    "emoji": "🏆"
                }
            },
            {
                "voter": {
                    "discordId": "555470950892568576",
                    "name": "AʟᴍɪʀVXɢᴀᴍᴇʀ"
                },
                "vote": {
                    "id": 1,
                    "description": "Da Hora",
                    "color": "#00FF00",
                    "emoji": "🏆"
                }
            },
            {
                "voter": {
                    "discordId": "271749848842108928",
                    "name": "Ro00dr1go"
                },
                "vote": {
                    "id": 1,
                    "description": "Da Hora",
                    "color": "#00FF00",
                    "emoji": "🏆"
                }
            },
            {
                "voter": {
                    "discordId": "405389229762281473",
                    "name": "FabioParadyze"
                },
                "vote": {
                    "id": 1,
                    "description": "Da Hora",
                    "color": "#00FF00",
                    "emoji": "🏆"
                }
            }
        ]
    },
    {
        "movie": {
            "id": 10,
            "title": "Guerra Sem Regras",
            "genre": "Ação",
            "year": "2024",
            "tmdbId": "799583",
            "dateAdded": "2025-09-14T03:29:05.044",
            "posterPath": "https://image.tmdb.org/t/p/original/xVlsA37y6w9COClNkvk6xq8yN5p.jpg",
            "chooser": {
                "discordId": "555470950892568576",
                "name": "AʟᴍɪʀVXɢᴀᴍᴇʀ"
            }
        },
        "votes": [
            {
                "voter": {
                    "discordId": "339251538998329354",
                    "name": "Bruno Reolon"
                },
                "vote": {
                    "id": 1,
                    "description": "Da Hora",
                    "color": "#00FF00",
                    "emoji": "🏆"
                }
            },
            {
                "voter": {
                    "discordId": "555470950892568576",
                    "name": "AʟᴍɪʀVXɢᴀᴍᴇʀ"
                },
                "vote": {
                    "id": 1,
                    "description": "Da Hora",
                    "color": "#00FF00",
                    "emoji": "🏆"
                }
            },
            {
                "voter": {
                    "discordId": "271749848842108928",
                    "name": "Ro00dr1go"
                },
                "vote": {
                    "id": 1,
                    "description": "Da Hora",
                    "color": "#00FF00",
                    "emoji": "🏆"
                }
            },
            {
                "voter": {
                    "discordId": "405389229762281473",
                    "name": "FabioParadyze"
                },
                "vote": {
                    "id": 1,
                    "description": "Da Hora",
                    "color": "#00FF00",
                    "emoji": "🏆"
                }
            }
        ]
    },
    {
        "movie": {
            "id": 11,
            "title": "O Labirinto do Fauno",
            "genre": "Fantasia",
            "year": "2006",
            "tmdbId": "1417",
            "dateAdded": "2025-09-14T03:29:06.021",
            "posterPath": "https://image.tmdb.org/t/p/original/qITtoZJxNj82ZwXUoLrqaYWUkop.jpg",
            "chooser": {
                "discordId": "555470950892568576",
                "name": "AʟᴍɪʀVXɢᴀᴍᴇʀ"
            }
        },
        "votes": [
            {
                "voter": {
                    "discordId": "339251538998329354",
                    "name": "Bruno Reolon"
                },
                "vote": {
                    "id": 2,
                    "description": "Lixo",
                    "color": "#FF0000",
                    "emoji": "💩"
                }
            },
            {
                "voter": {
                    "discordId": "555470950892568576",
                    "name": "AʟᴍɪʀVXɢᴀᴍᴇʀ"
                },
                "vote": {
                    "id": 1,
                    "description": "Da Hora",
                    "color": "#00FF00",
                    "emoji": "🏆"
                }
            },
            {
                "voter": {
                    "discordId": "271749848842108928",
                    "name": "Ro00dr1go"
                },
                "vote": {
                    "id": 2,
                    "description": "Lixo",
                    "color": "#FF0000",
                    "emoji": "💩"
                }
            },
            {
                "voter": {
                    "discordId": "405389229762281473",
                    "name": "FabioParadyze"
                },
                "vote": {
                    "id": 2,
                    "description": "Lixo",
                    "color": "#FF0000",
                    "emoji": "💩"
                }
            }
        ]
    },
    {
        "movie": {
            "id": 12,
            "title": "O Estrangeiro",
            "genre": "Ação",
            "year": "2017",
            "tmdbId": "379149",
            "dateAdded": "2025-09-14T03:29:06.982",
            "posterPath": "https://image.tmdb.org/t/p/original/c0k6pnGCNPJHmTHyRzY6tbgVZvl.jpg",
            "chooser": {
                "discordId": "555470950892568576",
                "name": "AʟᴍɪʀVXɢᴀᴍᴇʀ"
            }
        },
        "votes": [
            {
                "voter": {
                    "discordId": "339251538998329354",
                    "name": "Bruno Reolon"
                },
                "vote": {
                    "id": 1,
                    "description": "Da Hora",
                    "color": "#00FF00",
                    "emoji": "🏆"
                }
            },
            {
                "voter": {
                    "discordId": "555470950892568576",
                    "name": "AʟᴍɪʀVXɢᴀᴍᴇʀ"
                },
                "vote": {
                    "id": 1,
                    "description": "Da Hora",
                    "color": "#00FF00",
                    "emoji": "🏆"
                }
            },
            {
                "voter": {
                    "discordId": "271749848842108928",
                    "name": "Ro00dr1go"
                },
                "vote": {
                    "id": 1,
                    "description": "Da Hora",
                    "color": "#00FF00",
                    "emoji": "🏆"
                }
            },
            {
                "voter": {
                    "discordId": "405389229762281473",
                    "name": "FabioParadyze"
                },
                "vote": {
                    "id": 1,
                    "description": "Da Hora",
                    "color": "#00FF00",
                    "emoji": "🏆"
                }
            }
        ]
    },
    {
        "movie": {
            "id": 13,
            "title": "Exterritorial",
            "genre": "Thriller",
            "year": "2025",
            "tmdbId": "1233069",
            "dateAdded": "2025-09-14T03:29:07.943",
            "posterPath": "https://image.tmdb.org/t/p/original/micQGmD3K7Ni0wzyaSgBKGxrFWn.jpg",
            "chooser": {
                "discordId": "555470950892568576",
                "name": "AʟᴍɪʀVXɢᴀᴍᴇʀ"
            }
        },
        "votes": [
            {
                "voter": {
                    "discordId": "339251538998329354",
                    "name": "Bruno Reolon"
                },
                "vote": {
                    "id": 2,
                    "description": "Lixo",
                    "color": "#FF0000",
                    "emoji": "💩"
                }
            },
            {
                "voter": {
                    "discordId": "555470950892568576",
                    "name": "AʟᴍɪʀVXɢᴀᴍᴇʀ"
                },
                "vote": {
                    "id": 1,
                    "description": "Da Hora",
                    "color": "#00FF00",
                    "emoji": "🏆"
                }
            },
            {
                "voter": {
                    "discordId": "271749848842108928",
                    "name": "Ro00dr1go"
                },
                "vote": {
                    "id": 1,
                    "description": "Da Hora",
                    "color": "#00FF00",
                    "emoji": "🏆"
                }
            },
            {
                "voter": {
                    "discordId": "405389229762281473",
                    "name": "FabioParadyze"
                },
                "vote": {
                    "id": 1,
                    "description": "Da Hora",
                    "color": "#00FF00",
                    "emoji": "🏆"
                }
            }
        ]
    },
    {
        "movie": {
            "id": 14,
            "title": "Zona de Risco",
            "genre": "Ação",
            "year": "2024",
            "tmdbId": "969492",
            "dateAdded": "2025-09-14T03:29:08.952",
            "posterPath": "https://image.tmdb.org/t/p/original/qLqI0lA5WFIpItLCQNqPJYM3W6p.jpg",
            "chooser": {
                "discordId": "555470950892568576",
                "name": "AʟᴍɪʀVXɢᴀᴍᴇʀ"
            }
        },
        "votes": [
            {
                "voter": {
                    "discordId": "339251538998329354",
                    "name": "Bruno Reolon"
                },
                "vote": {
                    "id": 1,
                    "description": "Da Hora",
                    "color": "#00FF00",
                    "emoji": "🏆"
                }
            },
            {
                "voter": {
                    "discordId": "555470950892568576",
                    "name": "AʟᴍɪʀVXɢᴀᴍᴇʀ"
                },
                "vote": {
                    "id": 1,
                    "description": "Da Hora",
                    "color": "#00FF00",
                    "emoji": "🏆"
                }
            },
            {
                "voter": {
                    "discordId": "271749848842108928",
                    "name": "Ro00dr1go"
                },
                "vote": {
                    "id": 1,
                    "description": "Da Hora",
                    "color": "#00FF00",
                    "emoji": "🏆"
                }
            },
            {
                "voter": {
                    "discordId": "405389229762281473",
                    "name": "FabioParadyze"
                },
                "vote": {
                    "id": 1,
                    "description": "Da Hora",
                    "color": "#00FF00",
                    "emoji": "🏆"
                }
            }
        ]
    },
    {
        "movie": {
            "id": 15,
            "title": "Anônimo",
            "genre": "Ação",
            "year": "2021",
            "tmdbId": "615457",
            "dateAdded": "2025-09-14T03:29:09.963",
            "posterPath": "https://image.tmdb.org/t/p/original/qvW0h99en3sE8p1KQYZfO34VhZh.jpg",
            "chooser": {
                "discordId": "555470950892568576",
                "name": "AʟᴍɪʀVXɢᴀᴍᴇʀ"
            }
        },
        "votes": [
            {
                "voter": {
                    "discordId": "555470950892568576",
                    "name": "AʟᴍɪʀVXɢᴀᴍᴇʀ"
                },
                "vote": {
                    "id": 1,
                    "description": "Da Hora",
                    "color": "#00FF00",
                    "emoji": "🏆"
                }
            },
            {
                "voter": {
                    "discordId": "271749848842108928",
                    "name": "Ro00dr1go"
                },
                "vote": {
                    "id": 1,
                    "description": "Da Hora",
                    "color": "#00FF00",
                    "emoji": "🏆"
                }
            },
            {
                "voter": {
                    "discordId": "405389229762281473",
                    "name": "FabioParadyze"
                },
                "vote": {
                    "id": 1,
                    "description": "Da Hora",
                    "color": "#00FF00",
                    "emoji": "🏆"
                }
            }
        ]
    },
    {
        "movie": {
            "id": 16,
            "title": "Trem-Bala",
            "genre": "Ação",
            "year": "2022",
            "tmdbId": "718930",
            "dateAdded": "2025-09-14T03:29:10.935",
            "posterPath": "https://image.tmdb.org/t/p/original/cXMeF0FUFe9n3Om9GzMqwYMQCgw.jpg",
            "chooser": {
                "discordId": "555470950892568576",
                "name": "AʟᴍɪʀVXɢᴀᴍᴇʀ"
            }
        },
        "votes": [
            {
                "voter": {
                    "discordId": "339251538998329354",
                    "name": "Bruno Reolon"
                },
                "vote": {
                    "id": 1,
                    "description": "Da Hora",
                    "color": "#00FF00",
                    "emoji": "🏆"
                }
            },
            {
                "voter": {
                    "discordId": "555470950892568576",
                    "name": "AʟᴍɪʀVXɢᴀᴍᴇʀ"
                },
                "vote": {
                    "id": 1,
                    "description": "Da Hora",
                    "color": "#00FF00",
                    "emoji": "🏆"
                }
            },
            {
                "voter": {
                    "discordId": "271749848842108928",
                    "name": "Ro00dr1go"
                },
                "vote": {
                    "id": 1,
                    "description": "Da Hora",
                    "color": "#00FF00",
                    "emoji": "🏆"
                }
            },
            {
                "voter": {
                    "discordId": "405389229762281473",
                    "name": "FabioParadyze"
                },
                "vote": {
                    "id": 1,
                    "description": "Da Hora",
                    "color": "#00FF00",
                    "emoji": "🏆"
                }
            }
        ]
    },
    {
        "movie": {
        "id": 17,
        "title": "O Pacote",
        "genre": "Comédia",
        "year": "2018",
        "tmdbId": "503619",
        "dateAdded": "2025-09-14T03:29:11.884",
        "posterPath": "https://image.tmdb.org/t/p/original/7nztwZKWZXud3S4AZytF5fJuD4y.jpg",
        "chooser": {
            "discordId": "555470950892568576",
            "name": "AʟᴍɪʀVXɢᴀᴍᴇʀ"
        }
    },
    "votes": [
        {
            "voter": {
                "discordId": "339251538998329354",
                "name": "Bruno Reolon"
            },
            "vote": {
                "id": 1,
                "description": "Da Hora",
                "color": "#00FF00",
                "emoji": "🏆"
            }
        },
        {
            "voter": {
                "discordId": "555470950892568576",
                "name": "AʟᴍɪʀVXɢᴀᴍᴇʀ"
            },
            "vote": {
                "id": 1,
                "description": "Da Hora",
                "color": "#00FF00",
                "emoji": "🏆"
            }
        },
        {
            "voter": {
                "discordId": "271749848842108928",
                "name": "Ro00dr1go"
            },
            "vote": {
                "id": 1,
                "description": "Da Hora",
                "color": "#00FF00",
                "emoji": "🏆"
            }
        },
        {
            "voter": {
                "discordId": "405389229762281473",
                "name": "FabioParadyze"
            },
            "vote": {
                "id": 1,
                "description": "Da Hora",
                "color": "#00FF00",
                "emoji": "🏆"
            }
        }
    ]
    },
    {
        "movie": {
        "id": 18,
        "title": "Ricky Stanicky",
        "genre": "Comédia",
        "year": "2024",
        "tmdbId": "1022690",
        "dateAdded": "2025-09-14T03:29:12.882",
        "posterPath": "https://image.tmdb.org/t/p/original/8Y7jmf24lH9Ha1iMtqvVq5SzgXt.jpg",
        "chooser": {
            "discordId": "555470950892568576",
            "name": "AʟᴍɪʀVXɢᴀᴍᴇʀ"
        }
    },
    "votes": [
        {
            "voter": {
                "discordId": "339251538998329354",
                "name": "Bruno Reolon"
            },
            "vote": {
                "id": 1,
                "description": "Da Hora",
                "color": "#00FF00",
                "emoji": "🏆"
            }
        },
        {
            "voter": {
                "discordId": "555470950892568576",
                "name": "AʟᴍɪʀVXɢᴀᴍᴇʀ"
            },
            "vote": {
                "id": 2,
                "description": "Lixo",
                "color": "#FF0000",
                "emoji": "💩"
            }
        },
        {
            "voter": {
                "discordId": "271749848842108928",
                "name": "Ro00dr1go"
            },
            "vote": {
                "id": 1,
                "description": "Da Hora",
                "color": "#00FF00",
                "emoji": "🏆"
            }
        },
        {
            "voter": {
                "discordId": "405389229762281473",
                "name": "FabioParadyze"
            },
            "vote": {
                "id": 1,
                "description": "Da Hora",
                "color": "#00FF00",
                "emoji": "🏆"
            }
        }
    ]
    },
    {
        "movie": {
        "id": 19,
        "title": "A Primeira Profecia",
        "genre": "Terror",
        "year": "2024",
        "tmdbId": "437342",
        "dateAdded": "2025-09-14T03:29:13.853",
        "posterPath": "https://image.tmdb.org/t/p/original/tINXSJfPiVGrTZTHFz5TFDh6SeX.jpg",
        "chooser": {
            "discordId": "405389229762281473",
            "name": "FabioParadyze"
        }
    },
    "votes": [
        {
            "voter": {
                "discordId": "339251538998329354",
                "name": "Bruno Reolon"
            },
            "vote": {
                "id": 3,
                "description": "Não Assisti",
                "color": "#AAAAAA",
                "emoji": "💤"
            }
        },
        {
            "voter": {
                "discordId": "555470950892568576",
                "name": "AʟᴍɪʀVXɢᴀᴍᴇʀ"
            },
            "vote": {
                "id": 1,
                "description": "Da Hora",
                "color": "#00FF00",
                "emoji": "🏆"
            }
        },
        {
            "voter": {
                "discordId": "271749848842108928",
                "name": "Ro00dr1go"
            },
            "vote": {
                "id": 1,
                "description": "Da Hora",
                "color": "#00FF00",
                "emoji": "🏆"
            }
        },
        {
            "voter": {
                "discordId": "405389229762281473",
                "name": "FabioParadyze"
            },
            "vote": {
                "id": 1,
                "description": "Da Hora",
                "color": "#00FF00",
                "emoji": "🏆"
            }
        }
    ]
    },
    {
        "movie": {
        "id": 20,
        "title": "A Entidade",
        "genre": "Terror",
        "year": "2012",
        "tmdbId": "82507",
        "dateAdded": "2025-09-14T03:29:14.823",
        "posterPath": "https://image.tmdb.org/t/p/original/uTaCFSTQ29LKqLXJU75owdir04h.jpg",
        "chooser": {
            "discordId": "405389229762281473",
            "name": "FabioParadyze"
        }
    },
    "votes": [
        {
            "voter": {
                "discordId": "339251538998329354",
                "name": "Bruno Reolon"
            },
            "vote": {
                "id": 2,
                "description": "Lixo",
                "color": "#FF0000",
                "emoji": "💩"
            }
        },
        {
            "voter": {
                "discordId": "555470950892568576",
                "name": "AʟᴍɪʀVXɢᴀᴍᴇʀ"
            },
            "vote": {
                "id": 2,
                "description": "Lixo",
                "color": "#FF0000",
                "emoji": "💩"
            }
        },
        {
            "voter": {
                "discordId": "271749848842108928",
                "name": "Ro00dr1go"
            },
            "vote": {
                "id": 2,
                "description": "Lixo",
                "color": "#FF0000",
                "emoji": "💩"
            }
        },
        {
            "voter": {
                "discordId": "405389229762281473",
                "name": "FabioParadyze"
            },
            "vote": {
                "id": 2,
                "description": "Lixo",
                "color": "#FF0000",
                "emoji": "💩"
            }
        }
    ]
    },
    {
        "movie": {
        "id": 21,
        "title": "A Bruxa",
        "genre": "Terror",
        "year": "2016",
        "tmdbId": "310131",
        "dateAdded": "2025-09-14T03:29:15.801",
        "posterPath": "https://image.tmdb.org/t/p/original/qqOtwhj8DxOBIwI0u6ThooXEIBR.jpg",
        "chooser": {
            "discordId": "405389229762281473",
            "name": "FabioParadyze"
        }
    },
    "votes": [
        {
            "voter": {
                "discordId": "339251538998329354",
                "name": "Bruno Reolon"
            },
            "vote": {
                "id": 2,
                "description": "Lixo",
                "color": "#FF0000",
                "emoji": "💩"
            }
        },
        {
            "voter": {
                "discordId": "555470950892568576",
                "name": "AʟᴍɪʀVXɢᴀᴍᴇʀ"
            },
            "vote": {
                "id": 2,
                "description": "Lixo",
                "color": "#FF0000",
                "emoji": "💩"
            }
        },
        {
            "voter": {
                "discordId": "271749848842108928",
                "name": "Ro00dr1go"
            },
            "vote": {
                "id": 2,
                "description": "Lixo",
                "color": "#FF0000",
                "emoji": "💩"
            }
        },
        {
            "voter": {
                "discordId": "405389229762281473",
                "name": "FabioParadyze"
            },
            "vote": {
                "id": 2,
                "description": "Lixo",
                "color": "#FF0000",
                "emoji": "💩"
            }
        }
    ]
    },
    {
        "movie": {
        "id": 22,
        "title": "Mártires",
        "genre": "Terror",
        "year": "2008",
        "tmdbId": "9539",
        "dateAdded": "2025-09-14T03:29:16.778",
        "posterPath": "https://image.tmdb.org/t/p/original/68k6yxU07hjTBDrXTLPcuPlMKMc.jpg",
        "chooser": {
            "discordId": "405389229762281473",
            "name": "FabioParadyze"
        }
    },
    "votes": [
        {
            "voter": {
                "discordId": "555470950892568576",
                "name": "AʟᴍɪʀVXɢᴀᴍᴇʀ"
            },
            "vote": {
                "id": 2,
                "description": "Lixo",
                "color": "#FF0000",
                "emoji": "💩"
            }
        },
        {
            "voter": {
                "discordId": "271749848842108928",
                "name": "Ro00dr1go"
            },
            "vote": {
                "id": 2,
                "description": "Lixo",
                "color": "#FF0000",
                "emoji": "💩"
            }
        },
        {
            "voter": {
                "discordId": "405389229762281473",
                "name": "FabioParadyze"
            },
            "vote": {
                "id": 1,
                "description": "Da Hora",
                "color": "#00FF00",
                "emoji": "🏆"
            }
        }
    ]
    },
    {
        "movie": {
        "id": 23,
        "title": "Lamborghini: O Homem Por Trás da Lenda",
        "genre": "Drama",
        "year": "2022",
        "tmdbId": "457232",
        "dateAdded": "2025-09-14T03:29:17.739",
        "posterPath": "https://image.tmdb.org/t/p/original/kchdd5IbZzUursmoDOB7ztn6CSs.jpg",
        "chooser": {
            "discordId": "405389229762281473",
            "name": "FabioParadyze"
        }
    },
    "votes": [
        {
            "voter": {
                "discordId": "339251538998329354",
                "name": "Bruno Reolon"
            },
            "vote": {
                "id": 1,
                "description": "Da Hora",
                "color": "#00FF00",
                "emoji": "🏆"
            }
        },
        {
            "voter": {
                "discordId": "555470950892568576",
                "name": "AʟᴍɪʀVXɢᴀᴍᴇʀ"
            },
            "vote": {
                "id": 1,
                "description": "Da Hora",
                "color": "#00FF00",
                "emoji": "🏆"
            }
        },
        {
            "voter": {
                "discordId": "271749848842108928",
                "name": "Ro00dr1go"
            },
            "vote": {
                "id": 1,
                "description": "Da Hora",
                "color": "#00FF00",
                "emoji": "🏆"
            }
        },
        {
            "voter": {
                "discordId": "405389229762281473",
                "name": "FabioParadyze"
            },
            "vote": {
                "id": 1,
                "description": "Da Hora",
                "color": "#00FF00",
                "emoji": "🏆"
            }
        }
    ]
    },
    {
        "movie": {
        "id": 24,
        "title": "A Casa Sombria",
        "genre": "Drama",
        "year": "2021",
        "tmdbId": "547565",
        "dateAdded": "2025-09-14T03:29:18.704",
        "posterPath": "https://image.tmdb.org/t/p/original/sDbo3qnxxMnC1f4RMfmUlcKNNST.jpg",
        "chooser": {
            "discordId": "405389229762281473",
            "name": "FabioParadyze"
        }
    },
    "votes": [
        {
            "voter": {
                "discordId": "339251538998329354",
                "name": "Bruno Reolon"
            },
            "vote": {
                "id": 2,
                "description": "Lixo",
                "color": "#FF0000",
                "emoji": "💩"
            }
        },
        {
            "voter": {
                "discordId": "555470950892568576",
                "name": "AʟᴍɪʀVXɢᴀᴍᴇʀ"
            },
            "vote": {
                "id": 2,
                "description": "Lixo",
                "color": "#FF0000",
                "emoji": "💩"
            }
        },
        {
            "voter": {
                "discordId": "271749848842108928",
                "name": "Ro00dr1go"
            },
            "vote": {
                "id": 2,
                "description": "Lixo",
                "color": "#FF0000",
                "emoji": "💩"
            }
        },
        {
            "voter": {
                "discordId": "405389229762281473",
                "name": "FabioParadyze"
            },
            "vote": {
                "id": 2,
                "description": "Lixo",
                "color": "#FF0000",
                "emoji": "💩"
            }
        }
    ]
    },
    {
        "movie": {
        "id": 25,
        "title": "Código de Conduta",
        "genre": "Drama",
        "year": "2009",
        "tmdbId": "22803",
        "dateAdded": "2025-09-14T03:29:19.706",
        "posterPath": "https://image.tmdb.org/t/p/original/o6QL0gaDeFub0sbG7sUwmfCCFux.jpg",
        "chooser": {
            "discordId": "405389229762281473",
            "name": "FabioParadyze"
        }
    },
    "votes": [
        {
            "voter": {
                "discordId": "339251538998329354",
                "name": "Bruno Reolon"
            },
            "vote": {
                "id": 3,
                "description": "Não Assisti",
                "color": "#AAAAAA",
                "emoji": "💤"
            }
        },
        {
            "voter": {
                "discordId": "555470950892568576",
                "name": "AʟᴍɪʀVXɢᴀᴍᴇʀ"
            },
            "vote": {
                "id": 1,
                "description": "Da Hora",
                "color": "#00FF00",
                "emoji": "🏆"
            }
        },
        {
            "voter": {
                "discordId": "271749848842108928",
                "name": "Ro00dr1go"
            },
            "vote": {
                "id": 1,
                "description": "Da Hora",
                "color": "#00FF00",
                "emoji": "🏆"
            }
        },
        {
            "voter": {
                "discordId": "405389229762281473",
                "name": "FabioParadyze"
            },
            "vote": {
                "id": 1,
                "description": "Da Hora",
                "color": "#00FF00",
                "emoji": "🏆"
            }
        }
    ]
    },
    {
        "movie": {
        "id": 26,
        "title": "A Entidade 2",
        "genre": "Terror",
        "year": "2015",
        "tmdbId": "283445",
        "dateAdded": "2025-09-14T03:29:20.659",
        "posterPath": "https://image.tmdb.org/t/p/original/1nKrDcCzDG5LLamYb3dWWenE92L.jpg",
        "chooser": {
            "discordId": "405389229762281473",
            "name": "FabioParadyze"
        }
    },
    "votes": [
        {
            "voter": {
                "discordId": "339251538998329354",
                "name": "Bruno Reolon"
            },
            "vote": {
                "id": 2,
                "description": "Lixo",
                "color": "#FF0000",
                "emoji": "💩"
            }
        },
        {
            "voter": {
                "discordId": "555470950892568576",
                "name": "AʟᴍɪʀVXɢᴀᴍᴇʀ"
            },
            "vote": {
                "id": 3,
                "description": "Não Assisti",
                "color": "#AAAAAA",
                "emoji": "💤"
            }
        },
        {
            "voter": {
                "discordId": "271749848842108928",
                "name": "Ro00dr1go"
            },
            "vote": {
                "id": 2,
                "description": "Lixo",
                "color": "#FF0000",
                "emoji": "💩"
            }
        },
        {
            "voter": {
                "discordId": "405389229762281473",
                "name": "FabioParadyze"
            },
            "vote": {
                "id": 1,
                "description": "Da Hora",
                "color": "#00FF00",
                "emoji": "🏆"
            }
        }
    ]
    },
    {
        "movie": {
        "id": 27,
        "title": "Invasão ao Serviço Secreto",
        "genre": "Ação",
        "year": "2019",
        "tmdbId": "423204",
        "dateAdded": "2025-09-14T03:29:21.621",
        "posterPath": "https://image.tmdb.org/t/p/original/8LfvpWS7bLUtyOzs3KsdxRflHSu.jpg",
        "chooser": {
            "discordId": "271749848842108928",
            "name": "Ro00dr1go"
        }
    },
    "votes": [
        {
            "voter": {
                "discordId": "339251538998329354",
                "name": "Bruno Reolon"
            },
            "vote": {
                "id": 3,
                "description": "Não Assisti",
                "color": "#AAAAAA",
                "emoji": "💤"
            }
        },
        {
            "voter": {
                "discordId": "555470950892568576",
                "name": "AʟᴍɪʀVXɢᴀᴍᴇʀ"
            },
            "vote": {
                "id": 1,
                "description": "Da Hora",
                "color": "#00FF00",
                "emoji": "🏆"
            }
        },
        {
            "voter": {
                "discordId": "271749848842108928",
                "name": "Ro00dr1go"
            },
            "vote": {
                "id": 1,
                "description": "Da Hora",
                "color": "#00FF00",
                "emoji": "🏆"
            }
        },
        {
            "voter": {
                "discordId": "405389229762281473",
                "name": "FabioParadyze"
            },
            "vote": {
                "id": 1,
                "description": "Da Hora",
                "color": "#00FF00",
                "emoji": "🏆"
            }
        }
    ]
    },
    {
        "movie": {
        "id": 28,
        "title": "The Electric State",
        "genre": "Ficção científica",
        "year": "2025",
        "tmdbId": "777443",
        "dateAdded": "2025-09-14T03:29:22.578",
        "posterPath": "https://image.tmdb.org/t/p/original/mUBxeBpI5xg66YhLJxg8Ppv0ArW.jpg",
        "chooser": {
            "discordId": "271749848842108928",
            "name": "Ro00dr1go"
        }
    },
    "votes": [
        {
            "voter": {
                "discordId": "555470950892568576",
                "name": "AʟᴍɪʀVXɢᴀᴍᴇʀ"
            },
            "vote": {
                "id": 1,
                "description": "Da Hora",
                "color": "#00FF00",
                "emoji": "🏆"
            }
        },
        {
            "voter": {
                "discordId": "271749848842108928",
                "name": "Ro00dr1go"
            },
            "vote": {
                "id": 1,
                "description": "Da Hora",
                "color": "#00FF00",
                "emoji": "🏆"
            }
        },
        {
            "voter": {
                "discordId": "405389229762281473",
                "name": "FabioParadyze"
            },
            "vote": {
                "id": 1,
                "description": "Da Hora",
                "color": "#00FF00",
                "emoji": "🏆"
            }
        }
    ]
    },
    {
        "movie": {
        "id": 29,
        "title": "Beekeeper: Rede de Vingança",
        "genre": "Ação",
        "year": "2024",
        "tmdbId": "866398",
        "dateAdded": "2025-09-14T03:29:23.572",
        "posterPath": "https://image.tmdb.org/t/p/original/6Gw8MMtwE87W7rbrlmL2GnajFc5.jpg",
        "chooser": {
            "discordId": "271749848842108928",
            "name": "Ro00dr1go"
        }
    },
    "votes": [
        {
            "voter": {
                "discordId": "339251538998329354",
                "name": "Bruno Reolon"
            },
            "vote": {
                "id": 1,
                "description": "Da Hora",
                "color": "#00FF00",
                "emoji": "🏆"
            }
        },
        {
            "voter": {
                "discordId": "555470950892568576",
                "name": "AʟᴍɪʀVXɢᴀᴍᴇʀ"
            },
            "vote": {
                "id": 1,
                "description": "Da Hora",
                "color": "#00FF00",
                "emoji": "🏆"
            }
        },
        {
            "voter": {
                "discordId": "271749848842108928",
                "name": "Ro00dr1go"
            },
            "vote": {
                "id": 1,
                "description": "Da Hora",
                "color": "#00FF00",
                "emoji": "🏆"
            }
        },
        {
            "voter": {
                "discordId": "405389229762281473",
                "name": "FabioParadyze"
            },
            "vote": {
                "id": 1,
                "description": "Da Hora",
                "color": "#00FF00",
                "emoji": "🏆"
            }
        }
    ]
    },
    {
        "movie": {
        "id": 30,
        "title": "O Assassino: O Primeiro Alvo",
        "genre": "Ação",
        "year": "2017",
        "tmdbId": "415842",
        "dateAdded": "2025-09-14T03:29:24.541",
        "posterPath": "https://image.tmdb.org/t/p/original/juJrnDHS8kIDzdjtLkP9329bmah.jpg",
        "chooser": {
            "discordId": "271749848842108928",
            "name": "Ro00dr1go"
        }
    },
    "votes": [
        {
            "voter": {
                "discordId": "339251538998329354",
                "name": "Bruno Reolon"
            },
            "vote": {
                "id": 2,
                "description": "Lixo",
                "color": "#FF0000",
                "emoji": "💩"
            }
        },
        {
            "voter": {
                "discordId": "555470950892568576",
                "name": "AʟᴍɪʀVXɢᴀᴍᴇʀ"
            },
            "vote": {
                "id": 1,
                "description": "Da Hora",
                "color": "#00FF00",
                "emoji": "🏆"
            }
        },
        {
            "voter": {
                "discordId": "271749848842108928",
                "name": "Ro00dr1go"
            },
            "vote": {
                "id": 1,
                "description": "Da Hora",
                "color": "#00FF00",
                "emoji": "🏆"
            }
        },
        {
            "voter": {
                "discordId": "405389229762281473",
                "name": "FabioParadyze"
            },
            "vote": {
                "id": 1,
                "description": "Da Hora",
                "color": "#00FF00",
                "emoji": "🏆"
            }
        }
    ]
    },
    {
        "movie": {
        "id": 31,
        "title": "Presságio",
        "genre": "Ação",
        "year": "2009",
        "tmdbId": "13811",
        "dateAdded": "2025-09-14T03:29:25.507",
        "posterPath": "https://image.tmdb.org/t/p/original/d6FmGfaZqunwwZdvpjKYIUyqMp5.jpg",
        "chooser": {
            "discordId": "271749848842108928",
            "name": "Ro00dr1go"
        }
    },
    "votes": [
        {
            "voter": {
                "discordId": "339251538998329354",
                "name": "Bruno Reolon"
            },
            "vote": {
                "id": 1,
                "description": "Da Hora",
                "color": "#00FF00",
                "emoji": "🏆"
            }
        },
        {
            "voter": {
                "discordId": "555470950892568576",
                "name": "AʟᴍɪʀVXɢᴀᴍᴇʀ"
            },
            "vote": {
                "id": 1,
                "description": "Da Hora",
                "color": "#00FF00",
                "emoji": "🏆"
            }
        },
        {
            "voter": {
                "discordId": "271749848842108928",
                "name": "Ro00dr1go"
            },
            "vote": {
                "id": 1,
                "description": "Da Hora",
                "color": "#00FF00",
                "emoji": "🏆"
            }
        },
        {
            "voter": {
                "discordId": "405389229762281473",
                "name": "FabioParadyze"
            },
            "vote": {
                "id": 2,
                "description": "Lixo",
                "color": "#FF0000",
                "emoji": "💩"
            }
        }
    ]
    },
    {
        "movie": {
        "id": 32,
        "title": "K.O.",
        "genre": "Ação",
        "year": "2025",
        "tmdbId": "1450599",
        "dateAdded": "2025-09-14T03:29:26.457",
        "posterPath": "https://image.tmdb.org/t/p/original/o0brhd2qdfFL3o7VxFDsUfUSaML.jpg",
        "chooser": {
            "discordId": "271749848842108928",
            "name": "Ro00dr1go"
        }
    },
    "votes": [
        {
            "voter": {
                "discordId": "339251538998329354",
                "name": "Bruno Reolon"
            },
            "vote": {
                "id": 1,
                "description": "Da Hora",
                "color": "#00FF00",
                "emoji": "🏆"
            }
        },
        {
            "voter": {
                "discordId": "555470950892568576",
                "name": "AʟᴍɪʀVXɢᴀᴍᴇʀ"
            },
            "vote": {
                "id": 1,
                "description": "Da Hora",
                "color": "#00FF00",
                "emoji": "🏆"
            }
        },
        {
            "voter": {
                "discordId": "271749848842108928",
                "name": "Ro00dr1go"
            },
            "vote": {
                "id": 1,
                "description": "Da Hora",
                "color": "#00FF00",
                "emoji": "🏆"
            }
        },
        {
            "voter": {
                "discordId": "405389229762281473",
                "name": "FabioParadyze"
            },
            "vote": {
                "id": 1,
                "description": "Da Hora",
                "color": "#00FF00",
                "emoji": "🏆"
            }
        }
    ]
    },
    {
         "movie": {
        "id": 33,
        "title": "A Linha da Extinção",
        "genre": "Ação",
        "year": "2024",
        "tmdbId": "1035048",
        "dateAdded": "2025-09-14T03:29:27.412",
        "posterPath": "https://image.tmdb.org/t/p/original/8W6pH0sLPKSq8gM7qEnQiRSzWSN.jpg",
        "chooser": {
            "discordId": "271749848842108928",
            "name": "Ro00dr1go"
        }
    },
    "votes": [
        {
            "voter": {
                "discordId": "339251538998329354",
                "name": "Bruno Reolon"
            },
            "vote": {
                "id": 1,
                "description": "Da Hora",
                "color": "#00FF00",
                "emoji": "🏆"
            }
        },
        {
            "voter": {
                "discordId": "555470950892568576",
                "name": "AʟᴍɪʀVXɢᴀᴍᴇʀ"
            },
            "vote": {
                "id": 1,
                "description": "Da Hora",
                "color": "#00FF00",
                "emoji": "🏆"
            }
        },
        {
            "voter": {
                "discordId": "271749848842108928",
                "name": "Ro00dr1go"
            },
            "vote": {
                "id": 1,
                "description": "Da Hora",
                "color": "#00FF00",
                "emoji": "🏆"
            }
        },
        {
            "voter": {
                "discordId": "405389229762281473",
                "name": "FabioParadyze"
            },
            "vote": {
                "id": 1,
                "description": "Da Hora",
                "color": "#00FF00",
                "emoji": "🏆"
            }
        }
    ]
    },
    {
        "movie": {
        "id": 34,
        "title": "A Proposta",
        "genre": "Comédia",
        "year": "2009",
        "tmdbId": "18240",
        "dateAdded": "2025-09-14T03:29:27.721",
        "posterPath": "https://image.tmdb.org/t/p/original/uIhags0jXoe78JJjCDZbByciesQ.jpg",
        "chooser": {
            "discordId": "271749848842108928",
            "name": "Ro00dr1go"
        }
    },
    "votes": [
        {
            "voter": {
                "discordId": "339251538998329354",
                "name": "Bruno Reolon"
            },
            "vote": {
                "id": 1,
                "description": "Da Hora",
                "color": "#00FF00",
                "emoji": "🏆"
            }
        },
        {
            "voter": {
                "discordId": "555470950892568576",
                "name": "AʟᴍɪʀVXɢᴀᴍᴇʀ"
            },
            "vote": {
                "id": 1,
                "description": "Da Hora",
                "color": "#00FF00",
                "emoji": "🏆"
            }
        },
        {
            "voter": {
                "discordId": "271749848842108928",
                "name": "Ro00dr1go"
            },
            "vote": {
                "id": 1,
                "description": "Da Hora",
                "color": "#00FF00",
                "emoji": "🏆"
            }
        },
        {
            "voter": {
                "discordId": "405389229762281473",
                "name": "FabioParadyze"
            },
            "vote": {
                "id": 1,
                "description": "Da Hora",
                "color": "#00FF00",
                "emoji": "🏆"
            }
        }
    ]
    },
    {
"movie": {
        "id": 35,
        "title": "Infinito",
        "genre": "Ficção científica",
        "year": "2021",
        "tmdbId": "581726",
        "dateAdded": "2025-09-14T03:29:27.818",
        "posterPath": "https://image.tmdb.org/t/p/original/q3yAegenSHZgkMceNAzXTlBJYPg.jpg",
        "chooser": {
            "discordId": "271749848842108928",
            "name": "Ro00dr1go"
        }
    },
    "votes": [
        {
            "voter": {
                "discordId": "339251538998329354",
                "name": "Bruno Reolon"
            },
            "vote": {
                "id": 1,
                "description": "Da Hora",
                "color": "#00FF00",
                "emoji": "🏆"
            }
        },
        {
            "voter": {
                "discordId": "555470950892568576",
                "name": "AʟᴍɪʀVXɢᴀᴍᴇʀ"
            },
            "vote": {
                "id": 1,
                "description": "Da Hora",
                "color": "#00FF00",
                "emoji": "🏆"
            }
        },
        {
            "voter": {
                "discordId": "271749848842108928",
                "name": "Ro00dr1go"
            },
            "vote": {
                "id": 1,
                "description": "Da Hora",
                "color": "#00FF00",
                "emoji": "🏆"
            }
        },
        {
            "voter": {
                "discordId": "405389229762281473",
                "name": "FabioParadyze"
            },
            "vote": {
                "id": 1,
                "description": "Da Hora",
                "color": "#00FF00",
                "emoji": "🏆"
            }
        }
    ]
    },
    {
        "movie": {
        "id": 37,
        "title": "Stop-Loss: A Lei da Guerra",
        "genre": "Drama",
        "year": "2008",
        "tmdbId": "8988",
        "dateAdded": "2025-10-05T03:23:53.898",
        "posterPath": "https://image.tmdb.org/t/p/original/fTqD0qCha2tCegvZmQ6t5Mn66uz.jpg",
        "chooser": {
            "discordId": "405389229762281473",
            "name": "FabioParadyze"
        }
    },
    "votes": [
        {
            "voter": {
                "discordId": "339251538998329354",
                "name": "Bruno Reolon"
            },
            "vote": {
                "id": 1,
                "description": "Da Hora",
                "color": "#00FF00",
                "emoji": "🏆"
            }
        },
        {
            "voter": {
                "discordId": "555470950892568576",
                "name": "AʟᴍɪʀVXɢᴀᴍᴇʀ"
            },
            "vote": {
                "id": 1,
                "description": "Da Hora",
                "color": "#00FF00",
                "emoji": "🏆"
            }
        },
        {
            "voter": {
                "discordId": "271749848842108928",
                "name": "Ro00dr1go"
            },
            "vote": {
                "id": 1,
                "description": "Da Hora",
                "color": "#00FF00",
                "emoji": "🏆"
            }
        },
        {
            "voter": {
                "discordId": "405389229762281473",
                "name": "FabioParadyze"
            },
            "vote": {
                "id": 1,
                "description": "Da Hora",
                "color": "#00FF00",
                "emoji": "🏆"
            }
        }
    ]
    },
    {
        "movie": {
        "id": 39,
        "title": "Dunkirk",
        "genre": "Guerra",
        "year": "2017",
        "tmdbId": "374720",
        "dateAdded": "2025-10-05T03:33:01.184",
        "posterPath": "https://image.tmdb.org/t/p/original/3ldmcbmoQ6A9dUwphrwWxXIYQZM.jpg",
        "chooser": {
            "discordId": "271749848842108928",
            "name": "Ro00dr1go"
        }
    },
    "votes": [
        {
            "voter": {
                "discordId": "339251538998329354",
                "name": "Bruno Reolon"
            },
            "vote": {
                "id": 1,
                "description": "Da Hora",
                "color": "#00FF00",
                "emoji": "🏆"
            }
        },
        {
            "voter": {
                "discordId": "555470950892568576",
                "name": "AʟᴍɪʀVXɢᴀᴍᴇʀ"
            },
            "vote": {
                "id": 3,
                "description": "Não Assisti",
                "color": "#AAAAAA",
                "emoji": "💤"
            }
        },
        {
            "voter": {
                "discordId": "271749848842108928",
                "name": "Ro00dr1go"
            },
            "vote": {
                "id": 1,
                "description": "Da Hora",
                "color": "#00FF00",
                "emoji": "🏆"
            }
        }
    ]
    },
    {
        "movie": {
        "id": 213,
        "title": "Inatividade Paranormal",
        "genre": "Comédia",
        "year": "2013",
        "tmdbId": "139038",
        "dateAdded": "2025-11-09T06:10:31.47674",
        "posterPath": "https://image.tmdb.org/t/p/original/2Qi13G9tjRtCBeT6Lsw9jY45EES.jpg",
        "chooser": {
            "discordId": "405389229762281473",
            "name": "FabioParadyze"
        }
    },
    "votes": [
        {
            "voter": {
                "discordId": "339251538998329354",
                "name": "Bruno Reolon"
            },
            "vote": {
                "id": 1,
                "description": "Da Hora",
                "color": "#00FF00",
                "emoji": "🏆"
            }
        },
        {
            "voter": {
                "discordId": "271749848842108928",
                "name": "Ro00dr1go"
            },
            "vote": {
                "id": 1,
                "description": "Da Hora",
                "color": "#00FF00",
                "emoji": "🏆"
            }
        },
        {
            "voter": {
                "discordId": "555470950892568576",
                "name": "AʟᴍɪʀVXɢᴀᴍᴇʀ"
            },
            "vote": {
                "id": 1,
                "description": "Da Hora",
                "color": "#00FF00",
                "emoji": "🏆"
            }
        },
        {
            "voter": {
                "discordId": "405389229762281473",
                "name": "FabioParadyze"
            },
            "vote": {
                "id": 1,
                "description": "Da Hora",
                "color": "#00FF00",
                "emoji": "🏆"
            }
        }
    ]
    }
]