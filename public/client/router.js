Shortly.Router = Backbone.Router.extend({
  initialize: function(options){
    this.$el = options.el;
  },

  routes: {
    '':       'index',
    'create': 'create',
    '../views/login.ejs': 'login',
    'signup': 'signup'
  },

  swapView: function(view){
    this.$el.html(view.render().el);
  },

  index: function(){
    var links = new Shortly.Links();
    var linksView = new Shortly.LinksView({ collection: links });
    this.swapView(linksView);
  },

  create: function(){
    this.swapView(new Shortly.createLinkView());
  },

  // login: function(){
  //   this.swapView('../views/login.ejs');
  // },

  signup: function(){
    this.swapView('../views/signup.ejs');
  },

});
