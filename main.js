/*jslint white: true, plusplus: true, esversion: 6*/


(function() {
    'use strict'; //Force strict mode

    const

        MAGIC_ATTRIBUTE_FOR_ROLE                = 'data-role',
        MAGIC_ATTRIBUTE_FOR_WORD_COUNT          = 'data-word-count',
        MAGIC_ATTRIBUTE_FOR_DELIM               = 'data-delim',
        MAGIC_ATTRIBUTE_FOR_WORDS               = 'data-words',
        MAGIC_ATTRIBUTE_FOR_LINE_COUNT          = 'data-line-count',
        MAGIC_ATTRIBUTE_FOR_COLUMN_INDEX        = 'data-column-index',
        MAGIC_ATTRIBUTE_FOR_LINE_NUMBER         = 'data-line-number',
        MAGIC_ATTRIBUTE_FOR_CONTAINER_INTERVAL  = 'data-container-interval',
        MAGIC_ATTRIBUTE_FOR_INTERVAL_IN_MS      = 'data-interval-in-ms',

        MAGIC_VALUE_FOR_ROLE_CONTAINER          = 'text-slider-container',
        MAGIC_VALUE_FOR_ROLE_TEXT_LINE          = 'text-line',
        MAGIC_VALUE_FOR_ROLE_TEXT_COLUMN        = 'text-column',
        MAGIC_VALUE_FOR_ROLE_TEXT_CELL          = 'text-cell',

        CSS_SELECTOR_CONTAINS_WORD = '~=',
        CSS_LEFT_SQUARE_BRACKET = '[',
        CSS_RIGHT_SQUARE_BRACKET = ']',

        CW = CSS_SELECTOR_CONTAINS_WORD,
        LB = CSS_LEFT_SQUARE_BRACKET,
        RB = CSS_RIGHT_SQUARE_BRACKET,

        MAGIC_SELECTOR_FOR_IMAGE_CONTAINER = LB + MAGIC_ATTRIBUTE_FOR_ROLE + CW + MAGIC_VALUE_FOR_ROLE_CONTAINER + RB,
        MAGIC_SELECTOR_FOR_TEXT_LINE       = LB + MAGIC_ATTRIBUTE_FOR_ROLE + CW + MAGIC_VALUE_FOR_ROLE_TEXT_LINE + RB,
        MAGIC_SELECTOR_FOR_TEXT_COLUMN     = LB + MAGIC_ATTRIBUTE_FOR_ROLE + CW + MAGIC_VALUE_FOR_ROLE_TEXT_COLUMN + RB,

        is_numeric = function(n)
        {
            //https://stackoverflow.com/a/9716488/231316
            return !isNaN(parseFloat(n)) && isFinite(n);
        },

        get_int_attribute = function(element, name, fallback)
        {
            //Make sure the element actually has the attribute
            if(element.hasAttribute(name)){
                const
                    n = element.getAttribute(name)
                ;

                //Is it number-like?
                if(is_numeric(n)){
                    return parseInt(n, 10);
                }
            }

            //We should always have a fallback provided or the calling code
            //should be absolutely sure that it is accounted for.
            if(fallback !== undefined){
                return fallback;
            }

            //Return null or 0 or false really will always cause more headache
            //for a primitive function like this.
            throw 'get_int_attribute could not parse to a number and no fallback was provided';
        },

        get_line_words = function(line)
        {
            const
                //Get the delimiter or the default which is just a space
                delim = line.getAttribute(MAGIC_ATTRIBUTE_FOR_DELIM) || ' ',

                //Get the words as an attribute or use the inner HTML as a backup
                words = line.getAttribute(MAGIC_ATTRIBUTE_FOR_WORDS) || line.innerHTML,

                //Get our real words as an array
                real_words = words.split(delim)
            ;

            return real_words;
        },

        is_container_valid = function(container)
        {
            const
                word_count = get_int_attribute(container, MAGIC_ATTRIBUTE_FOR_WORD_COUNT, false),

                //Need to convert NodeList to array to use every
                lines = [].slice.call(container.querySelectorAll(MAGIC_SELECTOR_FOR_TEXT_LINE))
            ;

            //We're baking this into the system for now, until someone defines
            //what a three-word version would do
            if(word_count !== 2){
                console.warn('Only two words are currently supported');
                return false;
            }

            //Make sure that every line has the correct number of words
            return lines
                    .every(
                        (line) => {
                            return get_line_words(line).length === word_count;
                        }
                    )
                ;
        },

        rotate_text = function(container)
        {
            container
                .querySelectorAll(MAGIC_SELECTOR_FOR_TEXT_COLUMN)
                .forEach(
                    (column) => {
                        const
                            line_count = get_int_attribute(column, MAGIC_ATTRIBUTE_FOR_LINE_COUNT),
                            column_idx = get_int_attribute(column, MAGIC_ATTRIBUTE_FOR_COLUMN_INDEX),
                            line_number = get_int_attribute(column, MAGIC_ATTRIBUTE_FOR_LINE_NUMBER)
                        ;

                        let
                            offset,
                            next_line_number = line_number + 1
                        ;

                        //If we've over-stepped our bounds, reset
                        if(next_line_number > line_count){
                            next_line_number = 1;
                        }

                        //If these offset calculations don't make sense, I
                        //suggest that you draw a diagram. It really helps more
                        //than me explaining it here.
                        switch(column_idx){
                            case 0:
                                offset = ((next_line_number - 1) / line_count) * 100;
                                break;

                            case 1:
                                offset = ((line_count - next_line_number) / line_count) * 100;
                                break;
                        }

                        const
                            transform = 'translateY(-' + offset + '%)'
                        ;

                        column.setAttribute(MAGIC_ATTRIBUTE_FOR_LINE_NUMBER, next_line_number);
                        column.style.transform = transform;
                    }
                )
            ;
        },

        create_single_text_column = function(line_count, idx)
        {
            const
                ul = document.createElement('ul')
            ;

            ul.setAttribute(MAGIC_ATTRIBUTE_FOR_ROLE, MAGIC_VALUE_FOR_ROLE_TEXT_COLUMN);
            ul.setAttribute(MAGIC_ATTRIBUTE_FOR_LINE_COUNT, line_count);
            ul.setAttribute(MAGIC_ATTRIBUTE_FOR_LINE_NUMBER, 0);
            ul.setAttribute(MAGIC_ATTRIBUTE_FOR_COLUMN_INDEX, idx);

            return ul;
        },

        create_single_text_cell = function(text)
        {
            const
                li = document.createElement('li')
            ;

            li.setAttribute(MAGIC_ATTRIBUTE_FOR_ROLE, MAGIC_VALUE_FOR_ROLE_TEXT_CELL);
            li.appendChild(document.createTextNode(text));

            return li;
        },

        clearNodeContents = function (node)
        {
            while (node && node.firstChild){
                node.removeChild(node.firstChild);
            }
        },

        reverse_child_items = function(container)
        {
            const

                //Convert to array so that we can reverse it
                items = [].slice.call(container.childNodes),
                reversed = items.reverse()
            ;

            //Erase the container and re-add the items in reverse order
            clearNodeContents(container);
            reversed
                .forEach(
                    (item) => {
                        container.appendChild(item.cloneNode(true));
                    }
                )
            ;

        },

        setup_single_container = function(container)
        {
            //Sanity check the container and bail early if we don't support
            //the supplied configuration
            if(!is_container_valid(container)){
                console.warn('Container found but did not pass validation... skipping');
                return;
            }

            const
                //How many words per line are we dealing with? Technically we
                //only support 2 but we're trying to leave this a little open-
                //ended for the future
                word_count = get_int_attribute(container, MAGIC_ATTRIBUTE_FOR_WORD_COUNT, false),

                //What is the interval that we're using for the "pause", default
                //to 500ms if not set
                interval_in_ms = get_int_attribute(container, MAGIC_ATTRIBUTE_FOR_INTERVAL_IN_MS, 500),

                //Grab each of the lines
                lines = container.querySelectorAll(MAGIC_SELECTOR_FOR_TEXT_LINE),

                //Will hold each of the ULs
                columns = []
            ;

            let
                i
            ;

            //Create all of our columns
            for(i = 0; i < word_count; i++){
                columns.push(create_single_text_column(lines.length, i));
            }

            //Split each of the lines at the word boundaries and add to the
            //columns
            lines
                .forEach(
                    (line) => {
                        const
                            words = get_line_words(line)
                        ;

                        //We are for-ing over the lines insteach of forEach
                        //because we need to keep track of the index so that we
                        //know which column we are going to. Because we previously
                        //sanity-checked things we know that they should line up
                        //here safely.
                        for(i = 0; i < words.length; i++){
                            columns[i].appendChild(create_single_text_cell(words[i]));
                        }
                    }
                )
            ;

            //Add the columns to the container
            columns
                .forEach(
                    (ul) => {
                        container.appendChild(ul);
                    }
                )
            ;

            //Set the initial column positions
            container
                .querySelectorAll(LB + MAGIC_ATTRIBUTE_FOR_COLUMN_INDEX + RB)
                .forEach(
                    (column) => {
                        const
                            idx = get_int_attribute(column, MAGIC_ATTRIBUTE_FOR_COLUMN_INDEX),
                            line_count = get_int_attribute(column, MAGIC_ATTRIBUTE_FOR_LINE_COUNT)
                        ;

                        let
                            offset
                        ;

                        switch(idx){
                            case 0:
                                //Because the two columns are moving in opposite
                                //directions, we are going to reverse the order
                                //of the contents of the left-most column. This
                                //will allow the items to align when moving.
                                reverse_child_items(column);

                                //This column doesn't have an initial offset
                                offset = 0;
                                break;

                            case 1:
                                //We want to push everything off the top-edge of
                                //the containing box _except_ the last item. So
                                //if there are 5 items total we want to be -80%
                                //((4 - 1) / 5) * 100 * -1
                                //The 100 gets us a percentage and the -1 makes
                                //it negative
                                offset = ((line_count - 1) / line_count) * 100 * -1;
                                break;
                        }

                        const
                            transform = 'translateY(' + offset + '%)'
                        ;

                        //This is our "current line number" field
                        column.setAttribute(MAGIC_ATTRIBUTE_FOR_LINE_NUMBER, 1);
                        column.style.transform = transform;
                    }
                )
            ;

            const
                container_interval = window.setInterval(() => {rotate_text(container);}, interval_in_ms)
            ;

            //It is polite to always store an interval, just in case we need to
            //cancel it in the future.
            container.setAttribute(MAGIC_ATTRIBUTE_FOR_CONTAINER_INTERVAL, container_interval);
        },

        load = function()
        {
            const
                containers = document.querySelectorAll(MAGIC_SELECTOR_FOR_IMAGE_CONTAINER)
            ;

            //Sanity check that we've got something to work with
            if(0 === containers.length){
                console.log('No text slider things found... exiting');
                return;
            }

            //We support multiple instances on a page so set each on up
            //individually
            containers
                .forEach(
                    (container) => {
                        setup_single_container(container);
                    }
                )
            ;
        },

        init = function()
        {
            if(['complete', 'loaded', 'interactive'].includes(document.readyState)){
                //If the DOM is already set, then just load
                load();
            }else{
                //Otherwise, wait for the readevent
                document.addEventListener('DOMContentLoaded', load);
            }
        }

    ;

    //Kick everything off
    init();
}
()
);
