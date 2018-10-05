# Text Slider Thing
Pretty much just read the `index.html` file, that should describe things for you.

## Objects
There are three objects that you need to provide for the system to work, a *Container*, several *Text Lines* and lastly the individual *Text Words*. The first two should be obvious however *Text Words*, although they are generally "words" as you expect, one "word" can actually contain multiple English words separated by a space. For instance, you can tell the system that "Pizza Is" should be treated as a "word" as far as vertically shifting text is concerned. See the section on *Text Line* below for how to use the `data-delim` attribute to achieve this.

### Container
Your word container is identified by `data-role="text-slider-container"` and it must have `data-word-count="2"` set as well. For now, only two words are supported because I don't know how visually to shift other combinations. You may optionally also set `data-interval-in-ms` otherwise it defaults to 500. The tag for the container (in the example below a `<div>`) does not matter but you probably want something that's going to end up rendering block-ish.

    <div
        data-role="text-slider-container"
        data-word-count="2"
        data-interval-in-ms="1000"
    >
      <!-- text lines here -->
    </div>
    
### Text Line
A line of text is identified by `data-role="text-line"`. In the absense of any other attributes, the contents of the tag split at spaces is used.

    <div data-role="text-line">Pizza Yummy</div>
    <!-- Results in two words, "Pizza" and "Yummy" -->

Instead of the tag's contents, you may optionally provide the words in the `data-words` attribute.

    <div data-role="text-line" data-words="Pizza Yummy">This text is ignored</div>
    <!-- Results in two words, "Pizza" and "Yummy" -->

Because it is possible that one "word" might need to support spaces internally, you may provide a custom delimter using the `data-delim` attribute.

    <div data-role="text-line" data-delim="|" data-words="Pizza Is|Yummy"></div>
    <div data-role="text-line" data-delim="|">Pizza Is|Yummy</div>
    <!-- Both are the same and result in two words, "Pizza Is" and "Yummy" -->

Each line of text is independent so you may mix-and-match as needed:

    <div data-role="text-slider-container" data-word-count="2" data-interval-in-ms="1000">
        <div data-role="text-line" data-delim="," data-words="Things,Stuff"></div>
        <div data-role="text-line">Pizza Yummy</div>
        <div data-role="text-line" data-delim="|" data-words="Cats|Stupid"></div>
        <div data-role="text-line" data-delim="," data-words="Elephant,Large"></div>
    </div>
