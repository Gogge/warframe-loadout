define(['jquery', 'underscore', 'backbone', 'loadout/modules'],
function   ($, _, Backbone, Modules) {
    //
    // Search
    //
    
    ModControlView = Backbone.View.extend({
        tagName:"div",
        className:"cell",
        events: {
            "click .control.clear": "clear",
            "click .control.default": "default"
        },
        clear: function(e){
            e.preventDefault();
            this.options.weaponCategory.each(function(weapon){
                weapon.get("modules").each(function(module){
                    module.set("currentRank",0);
                });
                weapon.updateModuleDps();
            });
            this.options.weaponCategoryView.quickRender();
        },
        default: function(e){
            e.preventDefault();
            this.options.weaponCategory.each(function(weapon){
                weapon.initialize();
            });
            this.options.weaponCategoryView.quickRender();
        },
        render:function(){
            var template = _.template($("#modControlTemplate").html());
            this.$el.html(template());
        }
    });
    
    return this;
});