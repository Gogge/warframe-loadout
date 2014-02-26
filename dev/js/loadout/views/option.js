define(['jquery', 'underscore', 'backbone', 'loadout/weapons'],
function   ($, _, Backbone, Weapons) {
    //
    // Options
    //
    
    Option = Backbone.Model.extend({
        initialize:function(){
            //console.log("module init");
        },
        defaults:{
            name:"Default option"
        }
    });

    OptionsCollection = Backbone.Collection.extend({
       model: Option
    });
    
    OptionView = Backbone.View.extend({
        tagName:"div",
        className:"cell",
        events: {
            "click .option": "toggle"
        },
        toggle: function(e){
            e.preventDefault();
            var selected = this.model.get('option');
            if(!this.$el.find(".favorite").length){
                $(".mark").not(".favorite").addClass("faded");
                $(this.el).find(".mark").removeClass("faded");
                $(".weaponTypeHeader").not(".favorite").addClass("hidden");
                $(".weaponTypeHeader." + this.model.get('option')).removeClass("hidden");
            } else {
                $(this.el).find(".mark").toggleClass("faded");
                $(".weaponTypeHeader." + this.model.get('option')).toggleClass("hidden");
            }

            if(this.model.get('option') === "favorite"){
                $.cookie('favorite', !$(this.el).find(".mark").hasClass("faded"));
            } else {
                $.cookie('selected', selected);
            }
            
            var selectedCapitalized = selected.charAt(0).toUpperCase() + selected.slice(1);
            var categoryList = this.options.weaponCategoriesList[selectedCapitalized];
            
            if(categoryList.length === 0){
                var weaponArray = Weapons.weaponList.where({weaponType:selected});
                for(var i = 0;i<weaponArray.length;i++){
                    categoryList.add(new weaponArray[i].constructor("categoryLoad"));
                };
                categoryList.trigger('weaponLoad');
            }
        },
        render:function(){
            var template = _.template($("#optionsTemplate").html());
            this.$el.html(template({op:this.model}));
        }
    });
    
    OptionsListView = Backbone.View.extend({
        tagName:"div",
        initialize:function(){
            _.bindAll(this, "renderOption");
        },
        renderOption:function(model){
            var optionView = new OptionView({model:model, weaponCategoriesList:this.options.weaponCategoriesList, weaponView:this.options.weaponView});
            optionView.render();
            $(this.el).append(optionView.el);
        },
        render:function(){
            this.collection.each(this.renderOption);
        }
    });
    
    return this;
});

