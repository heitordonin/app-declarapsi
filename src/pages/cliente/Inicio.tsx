import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/carousel";
import { PagamentosCard } from "@/components/cliente/PagamentosCard";
import { ControleCard } from "@/components/cliente/ControleCard";

// Dados estáticos para os meses
const meses = [
  { mes: "SET/25", id: "09-2025" },
  { mes: "OUT/25", id: "10-2025" },
  { mes: "NOV/25", id: "11-2025" },
];

export default function Inicio() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Início</h1>
      <Carousel
        opts={{
          align: "start",
          loop: false,
          startIndex: 1, // Começa em Outubro (índice 1)
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {meses.map((item) => (
            <CarouselItem key={item.id} className="pl-4 basis-full md:basis-1/2 lg:basis-1/3">
              <div className="p-1">
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-center">{item.mes}</h2>
                  <div className="space-y-4">
                    <PagamentosCard />
                    <ControleCard />
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex" />
        <CarouselNext className="hidden md:flex" />
      </Carousel>
    </div>
  );
}
