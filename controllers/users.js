var readline = require('readline');
var fs = require('fs');

module.exports = function(app){
  app.get('/users', function(req, res){
    console.log('Recebida requisicao de teste na porta 3000.')
    res.send('OK.');
  });

  app.get('/users/firstload', function(req, res){
    const readable= fs.createReadStream('./Files/users.csv');

    const rl = readline.createInterface({
      input: readable,
      output: process.stdout
    })

    rl.on('line', (line)=>{
      console.log(line);
    })
  });

  app.get('/users/user/:id', function(req, res){
    var id = req.params.id;
    console.log('consultando usuário: ' + id);

    var memcachedClient = app.servicos.memcachedClient();

    memcachedClient.get('pagamento-' + id, function(erro, retorno){
      if (erro || !retorno){
        console.log('MISS - chave nao encontrada');

        var connection = app.persistencia.connectionFactory();
        var pagamentoDao = new app.persistencia.PagamentoDao(connection);

        pagamentoDao.buscaPorId(id, function(erro, resultado){
          if(erro){
            console.log('erro ao consultar no banco: ' + erro);
            res.status(500).send(erro);
            return;
          }
          console.log('pagamento encontrado: ' + JSON.stringify(resultado));
          res.json(resultado);
          return;
        });
        //HIT no cache
      } else {
        console.log('HIT - valor: ' + JSON.stringify(retorno));
        res.json(retorno);
        return;
      }
    });

  });

  app.post('/users/user', function(req, res){

    req.assert("pagamento.forma_de_pagamento",
      "Forma de pagamento eh obrigatorio").notEmpty();
    req.assert("pagamento.valor",
      "Valor eh obrigatorio e deve ser um decimal")
    .notEmpty().isFloat();

    var erros = req.validationErrors();

    if (erros){
      console.log('Erros de validacao encontrados');
      res.status(400).send(erros);
      return;
    }

    var pagamento = req.body["pagamento"];
    console.log('processando uma requisicao de um novo pagamento');

    pagamento.status = 'CRIADO';
    pagamento.data = new Date;

    var connection = app.persistencia.connectionFactory();
    var pagamentoDao = new app.persistencia.PagamentoDao(connection);

    pagamentoDao.salva(pagamento, function(erro, resultado){
      if(erro){
        console.log('Erro ao inserir no banco:' + erro);
        res.status(500).send(erro);
      } else {
        pagamento.id = resultado.insertId;
        console.log('pagamento criado');

        var memcachedClient = app.servicos.memcachedClient();
        memcachedClient.set('pagamento-' + pagamento.id, pagamento,
          60000, function(erro){
            console.log('nova chave adicionada ao cache: pagamento-' + pagamento.id);
          });

        if (pagamento.forma_de_pagamento == 'cartao'){
          var cartao = req.body["cartao"];
          console.log(cartao);

          var clienteCartoes = new app.servicos.clienteCartoes();

          clienteCartoes.autoriza(cartao,
            function(exception, request, response, retorno){
              if(exception){
                console.log(exception);
                res.status(400).send(exception);
                return;
              }
              console.log(retorno);

              res.location('/users/pagamento/' +
                pagamento.id);

              var response = {
                dados_do_pagamanto: pagamento,
                cartao: retorno,
                links: [
                {
                  href:"http://localhost:3000/users/pagamento/"
                  + pagamento.id,
                  rel:"confirmar",
                  method:"PUT"
                },
                {
                  href:"http://localhost:3000/users/pagamento/"
                  + pagamento.id,
                  rel:"cancelar",
                  method:"DELETE"
                }
                ]
              }

              res.status(201).json(response);
              return;
            });


        } else {
          res.location('/users/pagamento/' +
            pagamento.id);

          var response = {
            dados_do_pagamanto: pagamento,
            links: [
            {
              href:"http://localhost:3000/users/pagamento/"
              + pagamento.id,
              rel:"confirmar",
              method:"PUT"
            },
            {
              href:"http://localhost:3000/users/pagamento/"
              + pagamento.id,
              rel:"cancelar",
              method:"DELETE"
            }
            ]
          }

          res.status(201).json(response);
        }
      }
    });

  });
}
