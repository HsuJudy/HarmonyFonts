import { Button, Rows, Text, Accordion, AccordionItem, TypographyCard } from "@canva/app-ui-kit";
import * as React from "react";
import styles from "styles/components.css";
import { Font, requestFontSelection } from "@canva/asset";
import { addNativeElement } from "@canva/design";
import Together from "together-ai";

import { findFonts } from "@canva/asset";
import { get } from "http";

interface FontPairings {
  Contrast: string[];
  Complement: string[];
  Hierarchy: string[];
}
async function getSuggestedFonts(font: string[]) {
  const together = new Together({ apiKey: "ef53e7b59271746815ff4bcdfa7ac348b9bb06cd0a902d37bfcf2e1a3d24d98b" });
  const response = await together.chat.completions.create({
    messages: [
        {
                "role": "system",
                "content": "You are a font pairing expert. Given a font name as input, return a JSON object with three categories: \"Contrast,\" \"Complement,\" and \"Hierarchy.\" Each category should include an array of font names that pair well with the input font. The \"Contrast\" category should feature fonts that create a strong visual distinction from the input font, the \"Complement\" category should feature fonts that harmonize well together, and the \"Hierarchy\" category should feature fonts that help establish a clear visual hierarchy. The input font should be excluded from the arrays. Ensure the JSON object is properly structured.\n\nExample Input:\n\nplaintext\nCopy code\n\"Roboto\"\nExample Output:\n\njson\nCopy code\n{\n  \"Contrast\": [\n    \"Georgia\",\n    \"Times New Roman\",\n    \"Merriweather\"\n  ],\n  \"Complement\": [\n    \"Open Sans\",\n    \"Lato\",\n    \"Proxima Nova\"\n  ],\n  \"Hierarchy\": [\n    \"Lobster\",\n    \"Dancing Script\",\n    \"Pacifico\"\n  ]\n}"
        },
        {
                "role": "user",
                "content": `${font}`
        },
  ],
      model: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
      max_tokens: 512,
      temperature: 0.7,
      top_p: 0.7,
      top_k: 50,
      repetition_penalty: 1,
      stop: ["<|eot_id|>"],
      stream: true
  });
  let message: string = "";

  for await (const chunk of response) {
    // console.log(chunk.choices[0].delta.content);
    if (chunk.choices[0].delta.content) {
      message = message.concat(chunk.choices[0].delta.content);
    }
  }
  // console.log(response.choices[0].message.content)
  console.log(message)

  const jsonMatch = message.match(/{[\s\S]*}/);

  if (jsonMatch) {
    const jsonStr = jsonMatch[0];
    try {
        const fontPairings: FontPairings = JSON.parse(jsonStr);
        console.log(fontPairings);
        return fontPairings;
    } catch (error) {
        console.error("Invalid JSON:", error);
    }
  } else {
    console.log("No JSON object found.");
  }

}


async function addText(font: string) {
  await addNativeElement({
    type: "TEXT",
    children: [font || "Roboto"],
    // fontRef: font?.ref,
})}


function FontListRow({font}:{font: Font}){
  return(

    <AccordionItem title={font.name}>
      <TypographyCard ariaLabel={font.name} onClick={()=>addText(font.name)}>
        <Text>
        <img src={font.previewUrl} style={{ width: '80%', height: 'auto',  filter: 'invert(1)'}} />
        </Text>
      </TypographyCard>
      
    </AccordionItem>

  )
}

function FontList({fonts}: { fonts: Font[]}){
  const rows:JSX.Element[] = [];
  fonts.forEach(
    (font) => {
      rows.push( <FontListRow font={font} key={font.ref} />)
  });
  return <Accordion defaultExpanded>{rows}</Accordion>
}
function FontListText({fonts}: { fonts: FontPairings }){
  return (
  <Accordion defaultExpanded >
    <FontListRowText title = "Contrast" fonts={fonts.Contrast}/>
    <FontListRowText title = "Complement" fonts={fonts.Complement}/>
    <FontListRowText title = "Hierarchy" fonts={fonts.Hierarchy}/>
  </Accordion>)
}

// displys three font names collpsable
function FontListRowText({title, fonts}:{title: string, fonts: string[]}){
  return(

    <AccordionItem title={title}>
      {fonts.map((font) =><Rows spacing="1u">
  <TypographyCard
    ariaLabel={font}
    onClick={() => {addText(font)}}
   
  >
    <Text>
      {font}
    </Text>
  </TypographyCard>
</Rows>)}
      
    </AccordionItem>

  )
}


export function App() {
  // state for currently selected font
  const [selectedFont, setSelectedFont] = React.useState<Font | undefined>();
  const [recommendedFonts, setRecommendedFonts] = React.useState<Font[]>([]);
  const [recommendedFontsText, setRecommendedFontsText] = React.useState<FontPairings>();
  // const [hierarchyFonts, setHierarchyFonts] = React.useState<string[]>([]);
  // const [contrastFonts, setContrastFonts] = React.useState<string[]>([]);

  async function handleClick() {
    const fontResponse = await requestFontSelection({
      selectedFontRef: selectedFont?.ref,
    });
    if (fontResponse.type !== "COMPLETED") {
      return;
    }
     // Update the currently selected font
     setSelectedFont(fontResponse.font);

    await addNativeElement({
      type: "TEXT",
      children: [fontResponse.font.name],
      fontRef: selectedFont?.ref,
    });

    await getSuggestedFonts([selectedFont?.name || "Roboto"]);

  }
  // getSuggestedFonts calls api to get a json object of suggested fonts
  // findFonts is a canvas API that returns a list of fonts based on the input fontRefs
  async function getFonts() {
    const ref = selectedFont?.ref;
    let fontsResponse;
    let APIResponse;
    let fonts: string[] = [selectedFont?.name || "Roboto"];
    APIResponse = await getSuggestedFonts(fonts);
    setRecommendedFontsText(APIResponse);
    // get the font reference from canvas
    if (ref) {
      fontsResponse = await findFonts({
        fontRefs: [ref],
      });
    } else {
      fontsResponse = await findFonts();
    }
    // setRecommendedFonts([...fontsResponse.fonts])
    // console.log(fonts);

    
  }
  
  return (
    <div className={styles.scrollContainer}>
      <Rows spacing="1u">
        <Text>
          We can suggest a collection of fonts that will complement your chosen font
        </Text>
        <Button variant="primary" onClick={handleClick}>
          {selectedFont ? selectedFont.name:"Choose a font"}
        </Button>

        <Button variant="primary" onClick={getFonts}>
          Suggest me some font pairings!
        </Button>
 
      </Rows>
      
      {/* <div>{selectedFont && <img src={selectedFont.previewUrl} />}</div> */}
      <FontList fonts={recommendedFonts}></FontList>
      {recommendedFontsText && <FontListText fonts={recommendedFontsText}></FontListText>}
    </div>
  );
}

