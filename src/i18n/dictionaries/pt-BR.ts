import type { Messages } from "./en";

// Brazilian Portuguese UI copy. Typed as Messages, so a key missing here (or
// one that English does not have) is a compile error. Terminology: "review"
// and "feedback" are both "avaliação"; "avaliar" is the verb.
export const ptBR: Messages = {
  "meta.description": "Compartilhe e descubra avaliações de produtos",
  "meta.signIn": "Entrar",
  "meta.signUp": "Criar conta",
  "meta.signUpSuccess": "Conta criada",
  "meta.home": "Produtos",
  "meta.me": "Minha página",
  "meta.feedback": "Escrever avaliação",
  "meta.reviews": "Avaliações",
  "meta.notFound": "Página não encontrada",

  "common.you": "você",
  "common.reviewBy": "Avaliação de",
  "common.starsLabel": "{rating} de 5 estrelas",
  "common.opensAmazon": "(abre a Amazon)",
  "common.currentPrice": "Preço atual",

  "nav.label": "Principal",
  "nav.products": "Produtos",
  "nav.me": "Minha página",
  "nav.signedInAs": "Conectado como",
  "nav.signOut": "Sair",
  "nav.signingOut": "Saindo...",

  "landing.title": "Avaliações de quem realmente comprou.",
  "landing.lead":
    "Leia o que os donos dizem depois de semanas de uso de verdade e publique a sua quando um produto merecer.",
  "landing.signUp": "Criar uma conta",
  "landing.signIn": "Entrar",
  "landing.slip1.product": "Aspirador sem fio, 2ª geração",
  "landing.slip1.detail": "Tem há 1 ano",
  "landing.slip1.quote": "Sucção forte, mas a bateria acaba no meio da escada.",
  "landing.slip2.product": "Chaleira de aço inox, 1,7 L",
  "landing.slip2.detail": "Tem há 3 meses",
  "landing.slip2.quote":
    "Ferve rápido e a tampa não pinga. A alça esquenta depois de duas xícaras, por isso tirei uma estrela.",

  "auth.field.email": "E-mail",
  "auth.field.password": "Senha",
  "auth.field.firstName": "Nome",
  "auth.field.lastName": "Sobrenome",
  "auth.field.confirmPassword": "Confirme a senha",
  "auth.passwordHint": "Pelo menos 8 caracteres",
  "auth.signIn.title": "Que bom ver você de novo",
  "auth.signIn.lead":
    "Entre para publicar uma avaliação ou continuar de onde parou.",
  "auth.signIn.submit": "Entrar",
  "auth.signIn.pending": "Entrando...",
  "auth.signIn.noAccount": "Ainda não tem conta?",
  "auth.signIn.createOne": "Crie uma",
  "auth.signIn.slip.product": "Coador de café de cerâmica",
  "auth.signIn.slip.detail": "Tem há 6 meses",
  "auth.signIn.slip.quote":
    "Seis meses depois, ainda faz o melhor café da casa. Coa devagar, mas a graça é essa.",
  "auth.signUp.title": "Crie sua conta",
  "auth.signUp.lead":
    "Seu nome aparece em todas as avaliações que você publicar.",
  "auth.signUp.submit": "Criar conta",
  "auth.signUp.pending": "Criando conta...",
  "auth.signUp.haveAccount": "Já tem uma conta?",
  "auth.signUp.signIn": "Entrar",
  "auth.signUp.slip.product": "Fone com cancelamento de ruído",
  "auth.signUp.slip.detail": "Tem há 2 meses",
  "auth.signUp.slip.quote":
    "Silencioso no trem e confortável o dia inteiro de trabalho. O estojo é maior do que precisava.",
  "auth.success.slipProduct": "Sua primeira avaliação",
  "auth.success.stampLine1": "Conta",
  "auth.success.stampLine2": "criada",
  "auth.success.title": "Sua conta está pronta",
  "auth.success.body":
    "As avaliações que você escrever vão aparecer com o seu nome.",
  "auth.success.cta": "Entrar",

  "validation.email.required": "Informe o e-mail",
  "validation.email.invalid": "Informe um e-mail válido",
  "validation.password.required": "Informe a senha",
  "validation.password.min":
    "A senha precisa ter pelo menos {passwordMin} caracteres",
  "validation.password.tooLong": "A senha é longa demais",
  "validation.firstName.required": "Informe o nome",
  "validation.firstName.max": "O nome pode ter no máximo {nameMax} caracteres",
  "validation.lastName.required": "Informe o sobrenome",
  "validation.lastName.max":
    "O sobrenome pode ter no máximo {nameMax} caracteres",
  "validation.confirmPassword.required": "Confirme a senha",
  "validation.confirmPassword.mismatch": "As senhas não coincidem",
  "validation.product.required": "Escolha um produto para avaliar",
  "validation.rating.required": "Escolha uma nota",
  "validation.rating.int": "A nota precisa ser um número inteiro de estrelas",
  "validation.rating.max": "A nota pode ser no máximo 5 estrelas",
  "validation.comment.required": "Escreva um comentário",
  "validation.comment.min":
    "O comentário precisa ter pelo menos {commentMin} caracteres",
  "validation.comment.max":
    "O comentário pode ter no máximo {commentMax} caracteres",

  "errors.generic": "Algo deu errado. Tente novamente mais tarde.",
  "errors.validation": "Alguns campos estão inválidos",
  "errors.signInRequired": "Entre para continuar",
  "errors.accessDenied": "Acesso negado",
  "errors.invalidCredentials": "E-mail ou senha inválidos",
  "errors.emailTaken": "Este e-mail já está cadastrado",
  "errors.signUpFailed":
    "Não foi possível criar a conta. Tente novamente mais tarde.",
  "errors.signInFailed": "Não foi possível entrar. Tente novamente mais tarde.",
  "errors.signOutFailed": "Não foi possível sair. Tente novamente mais tarde.",
  "errors.alreadyReviewed": "Você já avaliou este produto",
  "errors.productNotFound": "Produto não encontrado",
  "errors.postFailed":
    "Não foi possível publicar a avaliação. Tente novamente mais tarde.",
  "errors.listMineFailed":
    "Não foi possível carregar suas avaliações. Tente novamente mais tarde.",
  "errors.hasReviewedFailed":
    "Não foi possível verificar suas avaliações. Tente novamente mais tarde.",
  "errors.reviewsFailed":
    "Não foi possível carregar as avaliações. Tente novamente mais tarde.",
  "errors.localeFailed":
    "Não foi possível salvar o idioma. Tente novamente mais tarde.",

  "catalog.title": "Escolha um produto que você já usou",
  "catalog.lead":
    "As ofertas do dia da Amazon, atualizadas toda noite. Encontre o que você comprou e conte para outras pessoas como ele se saiu.",
  "catalog.search.label": "Buscar produtos",
  "catalog.search.placeholder": "Smart TV, air fryer, o título de um livro…",
  "catalog.search.submit": "Buscar",
  "catalog.search.clear": "Limpar busca",
  "catalog.queryTooShort": "Digite pelo menos {min} caracteres para buscar.",
  "catalog.loadError":
    "Não foi possível carregar estes produtos. Atualize a página para tentar de novo.",
  "catalog.loadErrorTitle": "Não foi possível carregar o catálogo",
  "catalog.loadingList": "Carregando {title}",
  "catalog.loadingProducts": "Carregando produtos",
  "catalog.mostReviewed.title": "Mais avaliados aqui",
  "catalog.mostReviewed.description":
    "Os produtos que a nossa comunidade mais avaliou",
  "catalog.discounts.title": "Maiores descontos",
  "catalog.discounts.description":
    "Os maiores cortes de preço nas ofertas de hoje",
  "catalog.topRated.title": "Mais bem avaliados",
  "catalog.topRated.description":
    "Melhores notas na Amazon, com pelo menos {min} avaliações",
  "catalog.row.seeAll": "Ver tudo",
  "catalog.row.seeAllLabel": "Ver tudo em {title}",
  "catalog.row.previous": "Produtos anteriores em {title}",
  "catalog.row.next": "Próximos produtos em {title}",
  "catalog.row.emptyHere":
    "Nenhum produto aqui agora. Novas ofertas chegam toda noite.",
  "catalog.allProducts": "Todos os produtos",
  "catalog.categoryCount": "{count}, maiores descontos primeiro",
  "catalog.results.title": "Resultados da busca",
  "catalog.results.count.one": "{count} resultado para {query}",
  "catalog.results.count.other": "{count} resultados para {query}",
  "catalog.results.label": "Resultados para {query}",
  "catalog.noMatch.title": "Nenhum produto encontrado para {query}",
  "catalog.noMatch.body":
    "Confira a ortografia, tente menos palavras ou limpe a busca para ver as listas.",
  "catalog.pastEnd.title": "Esta página fica depois da última",
  "catalog.pastEnd.cta": "Ir para a primeira página",
  "catalog.unknownCategory.title": "Não encontramos essa categoria",
  "catalog.unknownCategory.body":
    "Talvez ela não tenha ofertas agora. As listas mostram todas as categorias que têm.",
  "catalog.unknownCategory.cta": "Ver todos os produtos",
  "catalog.empty.title": "Ainda não há produtos",
  "catalog.empty.body":
    "Os produtos aparecem aqui depois que a importação noturna das ofertas da Amazon roda. Volte depois da primeira execução.",

  "category.deals-all": "Mais ofertas",
  "category.automotive": "Automotivo",
  "category.baby": "Bebês",
  "category.beauty": "Beleza",
  "category.books": "Livros",
  "category.computers": "Computadores",
  "category.coupons": "Cupons",
  "category.eBooks": "eBooks",
  "category.electronics": "Eletrônicos",
  "category.eletro": "Eletrodomésticos",
  "category.fashion": "Moda",
  "category.grocery": "Alimentos e bebidas",
  "category.health-and-personal-care": "Saúde e cuidados pessoais",
  "category.home": "Casa",
  "category.kitchen": "Cozinha",
  "category.lawn-and-garden": "Jardim",
  "category.moveis": "Móveis",
  "category.office-products": "Escritório",
  "category.pet-products": "Pet shop",
  "category.sports": "Esportes",
  "category.tools": "Ferramentas",
  "category.toys-and-games": "Brinquedos e jogos",
  "category.tvs": "TVs",
  "category.video-games": "Games",

  "pagination.label": "Paginação",
  "pagination.previous": "Página anterior",
  "pagination.next": "Próxima página",
  "pagination.page": "Página {page}",

  "products.count.one": "{count} produto",
  "products.count.other": "{count} produtos",
  "products.card.discount": "{percent}% off",
  "products.card.was": "De",
  "products.card.reviewsHere.one": "{count} avaliação aqui",
  "products.card.reviewsHere.other": "{count} avaliações aqui",
  "products.card.noReviews": "Nenhuma avaliação ainda",
  "products.card.seeReviews.one": "Ver {count} avaliação",
  "products.card.seeReviews.other": "Ver {count} avaliações",

  "feedback.form.title": "Escrever avaliação",
  "feedback.form.leadBefore":
    "Conte a outros compradores como o produto se saiu. Ela será publicada como",
  "feedback.form.rating": "Nota",
  "feedback.form.comment": "Comentário",
  "feedback.form.placeholder":
    "Do que você gostou e sobre o que avisaria outras pessoas?",
  "feedback.form.characters": "{count} de {max} caracteres",
  "feedback.form.cancel": "Cancelar",
  "feedback.form.submit": "Publicar avaliação",
  "feedback.form.pending": "Publicando avaliação...",
  "feedback.form.posted": "Avaliação publicada",
  "feedback.form.seeYourReviews": "Ver suas avaliações",
  "feedback.form.previewEmpty":
    "Seu comentário aparece aqui enquanto você digita.",
  "feedback.already.stampLine1": "Já",
  "feedback.already.stampLine2": "avaliado",
  "feedback.already.title": "Você já avaliou este produto",
  "feedback.already.body":
    "Cada pessoa pode avaliar um produto uma vez. A sua está na sua página.",
  "feedback.already.back": "Voltar ao catálogo",
  "feedback.already.seeYourReviews": "Ver suas avaliações",
  "feedback.notFound.slipProduct": "Nenhum produto aqui",
  "feedback.notFound.slipAuthor": "ninguém ainda",
  "feedback.notFound.title": "Produto não encontrado",
  "feedback.notFound.body":
    "Este link não corresponde a um produto do catálogo. Busque no catálogo o produto que você quer avaliar.",
  "feedback.notFound.cta": "Ir para o catálogo",
  "feedback.postedAgo": "Publicada {ago}",
  "feedback.postedJustNow": "Publicada agora mesmo",

  "me.greeting": "Olá de novo, {name}",
  "me.memberSince": "Membro desde {date}",
  "me.lead":
    "Comprou algo que vale comentar? Encontre no catálogo e escreva enquanto ainda lembra dos detalhes.",
  "me.writeFeedback": "Escrever avaliação",
  "me.recentTitle": "Suas avaliações recentes",
  "me.accountTitle": "Sua conta",
  "me.loading": "Carregando sua página",
  "me.loadingRecent": "Carregando suas avaliações recentes",
  "me.slipProduct": "Algo que você comprou recentemente",
  "me.field.name": "Nome",
  "me.field.email": "E-mail",
  "me.field.membership": "Cadastro",
  "me.recent.loadFailed":
    "Não foi possível carregar suas avaliações. Atualize a página para tentar de novo.",
  "me.recent.emptyTitle": "Nenhuma avaliação ainda",
  "me.recent.emptyBody":
    "Escolha um produto no catálogo e suas avaliações aparecem aqui, das mais novas para as mais antigas.",
  "me.recent.emptyCta": "Encontrar um produto para avaliar",
  "me.language.label": "Idioma",
  "me.language.hint": "Usado em todas as páginas e nos resumos de IA.",
  "me.language.saving": "Salvando...",

  "reviews.seeFeedback": "Ver avaliações",
  "reviews.seeAllReviews": "Ver todas as avaliações",
  "reviews.ofProduct": "de {title}",
  "reviews.amazonRating": "{rating} na Amazon ({count})",
  "reviews.amazonRatingNoCount": "{rating} na Amazon",
  "reviews.giveFeedback": "Avaliar",
  "reviews.alreadyReviewed": "Você avaliou este produto",
  "reviews.loading": "Carregando o produto",
  "reviews.count.one": "{count} avaliação",
  "reviews.count.other": "{count} avaliações",
  "reviews.stars.one": "{count} estrela",
  "reviews.stars.other": "{count} estrelas",
  "reviews.stats.title": "Nota da comunidade",
  "reviews.stats.outOf": "de 5",
  "reviews.stats.averageLabel": "Nota média {average} de 5",
  "reviews.stats.noAverage": "Nenhuma nota ainda",
  "reviews.stats.distribution": "Notas por estrelas",
  "reviews.list.title": "Avaliações da comunidade",
  "reviews.list.reviewBy": "Avaliação de",
  "reviews.list.formerMember": "uma conta removida",
  "reviews.list.loadFailed":
    "Não foi possível carregar as avaliações. Atualize a página para tentar de novo.",
  "reviews.empty.title": "Nenhuma avaliação ainda",
  "reviews.empty.body":
    "Já usou este produto? A sua avaliação é a primeira coisa que o próximo comprador vai ler.",
  "reviews.empty.cta": "Faça a primeira avaliação",
  "reviews.pastEnd.body": "Não há avaliações nesta página.",
  "reviews.pastEnd.cta": "Ir para as avaliações mais recentes",
  "reviews.summary.label": "Resumo de IA",
  "reviews.summary.verdict.positive": "Maioria positiva",
  "reviews.summary.verdict.mixed": "Opiniões divididas",
  "reviews.summary.verdict.negative": "Maioria negativa",
  "reviews.summary.pros": "Do que as pessoas gostam",
  "reviews.summary.cons": "Do que as pessoas não gostam",
  "reviews.summary.footer.one":
    "Resumo de IA de {count} avaliação, atualizado em {date}",
  "reviews.summary.footer.other":
    "Resumo de IA de {count} avaliações, atualizado em {date}",
  "reviews.summary.tooFew": "O resumo aparece depois de 3 avaliações",
  "reviews.summary.tooFewBody":
    "Quando três pessoas avaliarem este produto, um resumo de IA do que elas acham aparece aqui.",
  "reviews.summary.unavailable": "Resumo indisponível no momento",
  "reviews.summary.unavailableBody":
    "Todas as avaliações estão logo abaixo. O resumo volta em uma próxima visita.",
  "reviews.summary.loading": "Escrevendo o resumo de IA",

  "disclaimer.title": "Um projeto de estudo",
  "disclaimer.body":
    "O Product Review System é um projeto de estudo e portfólio, sem fins lucrativos. Os dados pessoais que você informar são usados só para fazer esta demonstração funcionar e nunca são compartilhados, vendidos ou usados para outra coisa. Você nunca vai receber e-mails dele. Dependendo de quando você visitar, alguns recursos (como a importação de produtos ou os resumos de IA) podem estar desligados para manter o projeto gratuito — abra uma issue no GitHub e eles serão religados para testes.",
  "disclaimer.footer":
    "Projeto de estudo, sem fins lucrativos. Seus dados não são usados para mais nada e você nunca vai receber e-mails. Alguns recursos podem estar desligados às vezes — peça no GitHub para religá-los.",
  "disclaimer.contact": "Fale conosco no GitHub",
  "disclaimer.opensNewTab": "(abre em uma nova aba)",

  "notFound.title": "Página não encontrada",
  "notFound.body":
    "Este link não leva a nenhuma página daqui. Talvez ela tenha mudado de lugar ou o endereço tenha um erro de digitação.",
  "notFound.cta": "Ir para o catálogo",
  "notFound.slipProduct": "Nada neste endereço",
  "notFound.slipAuthor": "ninguém ainda",
};
