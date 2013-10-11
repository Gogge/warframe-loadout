define(['jquery', 'underscore', 'backbone'],
function   ($, _, Backbone) {
    //
    // Search
    //
    
    SearchView = Backbone.View.extend({
        tagName:"div",
        className:"cell",
        events: {
            "keyup input.filter": "update"
        },
        update: function(e){
            e.preventDefault();
            $(".name").not(".fav").parent().parent().parent().removeClass("hidden");
            $(".name").not(":icontains(" + e.currentTarget.value + ")").not(".fav").parent().parent().parent().addClass("hidden");
        },
        render:function(){
            var template = _.template($("#searchTemplate").html());
            this.$el.html(template());
        }
    });
    
    return this;
});