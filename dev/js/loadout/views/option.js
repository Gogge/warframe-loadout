define(['jquery', 'underscore', 'backbone'],
function   ($, _, Backbone) {
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
            if(!this.$el.find(".favorite").length){
                $(".mark").not(".favorite").addClass("faded");
                $(this.el).find(".mark").removeClass("faded");
                $(".weaponTypeHeader").not(".favorite").addClass("hidden");
                $(".weaponTypeHeader." + this.model.get('option')).removeClass("hidden");
            } else {
                $(this.el).find(".mark").toggleClass("faded");
                $(".weaponTypeHeader." + this.model.get('option')).toggleClass("hidden");
            }
            
            var hidden_options = [];
            $(".weaponTypeHeader.hidden").each(function(){
                hidden_options.push($(this).attr("id"));
            });
            
            $.cookie('options', hidden_options);
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
            var optionView = new OptionView({model:model});
            optionView.render();
            $(this.el).append(optionView.el);
        },
        render:function(){
            this.collection.each(this.renderOption);
        }
    });
    
    return this;
});

